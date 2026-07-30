package com.flopay.ledger;

import com.flopay.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The only code path allowed to write to {@code posting} or change
 * {@link Account#getBalanceMinor()}. Every other service that needs to move
 * money — top-ups, P2P transfers, checkout capture, settlement, refunds —
 * calls {@link #post} rather than touching the ledger tables directly.
 */
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final PostingRepository postingRepository;

    /**
     * Writes a balanced journal entry.
     *
     * @param idempotencyKey caller-supplied, stable across retries of the same
     *                       logical operation. A repeat call with a key already
     *                       used returns the original entry unchanged rather
     *                       than posting a second time.
     * @param kind           free-text tag for reporting (e.g. "P2P_TRANSFER")
     * @param referenceId    id of whatever domain object drove this entry
     * @param lines          two or more postings; must sum to zero
     */
    @Transactional
    public JournalEntry post(String idempotencyKey, String kind, String referenceId, List<PostingLine> lines) {
        var existing = journalEntryRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return existing.get();
        }

        validateBalanced(lines);

        // Lock every distinct account touched, one at a time, in ascending id
        // order. This is what stops an A→B transfer racing a concurrent B→A
        // transfer from deadlocking: both transactions request the same lower
        // id first, so the second one simply waits rather than each holding a
        // different lock and waiting on the other.
        List<Long> distinctIds = lines.stream().map(PostingLine::accountId).distinct().sorted().toList();

        Map<Long, Account> lockedAccounts = new LinkedHashMap<>();
        for (Long id : distinctIds) {
            Account account = accountRepository.findByIdForUpdate(id)
                    .orElseThrow(() -> ApiException.notFound("Account " + id + " does not exist"));
            lockedAccounts.put(id, account);
        }

        // Pre-check every debit against the balance we now hold locked, so an
        // overdraft comes back as a clear domain error. The database's own
        // CHECK constraint (balance_minor >= 0, except ISSUANCE) is the actual
        // backstop this relies on — this check exists only to fail with a
        // better message than a raw constraint-violation stack trace.
        for (PostingLine line : lines) {
            if (line.direction() == PostingDirection.DEBIT) {
                Account account = lockedAccounts.get(line.accountId());
                boolean mayGoNegative = account.getKind() == AccountKind.ISSUANCE;
                if (!mayGoNegative && account.getBalanceMinor() - line.amountMinor() < 0) {
                    throw ApiException.badRequest("Insufficient balance on account " + account.getId());
                }
            }
        }

        JournalEntry entry = journalEntryRepository.save(
                JournalEntry.builder().idempotencyKey(idempotencyKey).kind(kind).referenceId(referenceId).build());

        for (PostingLine line : lines) {
            Account account = lockedAccounts.get(line.accountId());
            long delta = line.direction() == PostingDirection.CREDIT ? line.amountMinor() : -line.amountMinor();
            account.setBalanceMinor(account.getBalanceMinor() + delta);
            accountRepository.save(account);

            postingRepository.save(Posting.builder()
                    .entry(entry)
                    .account(account)
                    .direction(line.direction())
                    .amountMinor(line.amountMinor())
                    .build());
        }

        return entry;
    }

    private void validateBalanced(List<PostingLine> lines) {
        if (lines.size() < 2) {
            throw ApiException.badRequest("A journal entry needs at least two posting lines");
        }
        long debits = lines.stream()
                .filter(line -> line.direction() == PostingDirection.DEBIT)
                .mapToLong(PostingLine::amountMinor)
                .sum();
        long credits = lines.stream()
                .filter(line -> line.direction() == PostingDirection.CREDIT)
                .mapToLong(PostingLine::amountMinor)
                .sum();
        if (debits != credits) {
            throw ApiException.badRequest(
                    "Journal entry is not balanced: debits=" + debits + " credits=" + credits);
        }
    }

    public Account getAccount(AccountOwnerType ownerType, Long ownerId, AccountKind kind, String currency) {
        return accountRepository.findByOwnerTypeAndOwnerIdAndKindAndCurrency(ownerType, ownerId, kind, currency)
                .orElseThrow(() -> ApiException.notFound("No " + kind + " account for this owner"));
    }

    /**
     * Creates an account. Callers must ensure this only ever runs once per
     * (owner, kind, currency) — the unique constraint in V2__ledger.sql will
     * reject a second one, but this method does not attempt to recover from
     * that race by re-fetching. In practice that means: call it from a
     * naturally single-writer flow (signup provisioning a user's wallet;
     * the V2 migration provisioning the two SYSTEM accounts), not lazily from
     * a path that might run concurrently for the same owner.
     */
    @Transactional
    public Account openAccount(AccountOwnerType ownerType, Long ownerId, AccountKind kind, String currency) {
        return accountRepository.save(Account.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .kind(kind)
                .currency(currency)
                .balanceMinor(0L)
                .build());
    }
}
