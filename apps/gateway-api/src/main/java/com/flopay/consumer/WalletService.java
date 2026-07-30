package com.flopay.consumer;

import com.flopay.common.ApiException;
import com.flopay.consumer.dto.WalletDtos.TransactionResponse;
import com.flopay.consumer.dto.WalletDtos.WalletResponse;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.JournalEntry;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.Posting;
import com.flopay.ledger.PostingLine;
import com.flopay.ledger.PostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private static final String CURRENCY = "INR";

    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final PostingRepository postingRepository;

    @Transactional(readOnly = true)
    public WalletResponse getWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        Account wallet = ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.WALLET, CURRENCY);

        return new WalletResponse(user.getVpa(), user.getDisplayName(), wallet.getBalanceMinor(), wallet.getCurrency());
    }

    /**
     * Sandbox-only: mints demo money straight into the caller's wallet from the
     * ISSUANCE account. This is the minimum needed to fund a wallet at all — not
     * the full Add Money feature (real payment methods, limits, etc.), just
     * enough for the rest of the wallet to be testable through the real UI
     * instead of poking the database directly.
     */
    @Transactional
    public WalletResponse topUp(Long userId, long amountMinor, String idempotencyKey) {
        Account issuance = ledgerService.getAccount(AccountOwnerType.SYSTEM, Account.SYSTEM_OWNER_ID, AccountKind.ISSUANCE, CURRENCY);
        Account wallet = ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.WALLET, CURRENCY);

        ledgerService.post(
                idempotencyKey, "SANDBOX_TOPUP", null, "Demo top-up",
                List.of(PostingLine.debit(issuance.getId(), amountMinor), PostingLine.credit(wallet.getId(), amountMinor)));

        return getWallet(userId);
    }

    /**
     * @implNote Must run inside one transaction: building each row lazily
     *           dereferences posting.getEntry() and the counterparty
     *           posting's account proxy, and without an open Hibernate
     *           session those throw LazyInitializationException — this method
     *           threw exactly that in its first real test run before this
     *           annotation was added.
     */
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions(Long userId) {
        Account wallet = ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.WALLET, CURRENCY);

        return postingRepository.findTop50ByAccountIdOrderByIdDesc(wallet.getId()).stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    private TransactionResponse toTransactionResponse(Posting posting) {
        JournalEntry entry = posting.getEntry();
        Optional<Posting> counterpartyPosting = postingRepository.findByEntryId(entry.getId()).stream()
                .filter(p -> !p.getId().equals(posting.getId()))
                .findFirst();

        String counterpartyVpa = null;
        String counterpartyName = null;
        if (counterpartyPosting.isPresent()) {
            Account counterpartyAccount = counterpartyPosting.get().getAccount();
            // Only USER-owned counterparties have a name worth showing — a
            // SYSTEM account (top-up's ISSUANCE leg) has no VPA/display name;
            // the frontend falls back to the entry's `kind` in that case.
            if (counterpartyAccount.getOwnerType() == AccountOwnerType.USER) {
                User counterpartyUser = userRepository.findById(counterpartyAccount.getOwnerId()).orElse(null);
                if (counterpartyUser != null) {
                    counterpartyVpa = counterpartyUser.getVpa();
                    counterpartyName = counterpartyUser.getDisplayName();
                }
            }
        }

        return new TransactionResponse(
                entry.getId().toString(),
                entry.getKind(),
                posting.getDirection(),
                posting.getAmountMinor(),
                entry.getReferenceId(),
                entry.getNote(),
                counterpartyVpa,
                counterpartyName,
                entry.getCreatedAt());
    }
}
