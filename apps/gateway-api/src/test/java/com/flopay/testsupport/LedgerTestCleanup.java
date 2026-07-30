package com.flopay.testsupport;

import com.flopay.ledger.AccountRepository;
import com.flopay.ledger.JournalEntryRepository;
import com.flopay.ledger.Posting;
import com.flopay.ledger.PostingRepository;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Deletes a test-created account and every journal entry it ever touched.
 *
 * <p>Getting the order wrong here is a real, repeatable mistake — it has
 * broken three different test classes so far: {@code posting} has FK
 * references to both {@code account} and {@code journal_entry}, and deleting
 * either parent first is rejected. Deleting only the postings on THIS
 * account (rather than every posting on the shared entry) leaves the
 * counterparty leg still referencing the entry, which then blocks deleting
 * the entry too. The only correct order is: for every entry this account
 * participated in, delete every posting on that entry — both legs, not just
 * this account's — then the entry, then finally the account.
 */
public final class LedgerTestCleanup {

    private LedgerTestCleanup() {
    }

    public static void deleteAccountAndItsHistory(
            Long accountId,
            AccountRepository accountRepository,
            PostingRepository postingRepository,
            JournalEntryRepository journalEntryRepository
    ) {
        Set<UUID> entryIds = new LinkedHashSet<>();
        for (Posting posting : postingRepository.findByAccountId(accountId)) {
            entryIds.add(posting.getEntry().getId());
        }

        for (UUID entryId : entryIds) {
            postingRepository.deleteAll(postingRepository.findByEntryId(entryId));
            journalEntryRepository.deleteById(entryId);
        }

        accountRepository.deleteById(accountId);
    }
}
