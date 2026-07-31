package com.flopay.ledger;

import com.flopay.common.ApiException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Runs against a real Postgres instance (see application-local.yml, gitignored
 * — you need your own dev database configured to run this). Deliberately does
 * NOT use Spring's default test-transaction rollback: several of these tests
 * exist specifically to prove behaviour that only happens at real COMMIT time
 * (the deferred constraint trigger, genuine row-level locking under
 * concurrency), and a test transaction that always rolls back would never
 * reach that point. Every test cleans up its own rows in @AfterEach instead.
 */
@SpringBootTest
@ActiveProfiles({"dev", "local"})
class LedgerServiceTest {

    @Autowired
    private LedgerService ledgerService;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private JournalEntryRepository journalEntryRepository;
    @Autowired
    private PostingRepository postingRepository;
    @Autowired
    private PlatformTransactionManager transactionManager;

    private TransactionTemplate newTransaction;

    /** A fresh, random owner id per test so parallel test runs never collide. */
    private long testOwnerId;
    private Account issuance;
    private Account wallet;

    @BeforeEach
    void setUp() {
        newTransaction = new TransactionTemplate(transactionManager);
        newTransaction.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        testOwnerId = System.nanoTime(); // unique enough across test runs
        issuance = ledgerService.getAccount(AccountOwnerType.SYSTEM, Account.SYSTEM_OWNER_ID, AccountKind.ISSUANCE, "INR");
        wallet = ledgerService.openAccount(AccountOwnerType.USER, testOwnerId, AccountKind.WALLET, "INR");
    }

    @AfterEach
    void tearDown() {
        newTransaction.executeWithoutResult(status -> {
            // Every journal entry has a second leg on the ISSUANCE account, not
            // just the leg touching this test's wallet — deleting only the
            // wallet-side postings leaves the issuance-side posting still
            // referencing the entry, which then blocks deleting the entry via
            // its FK. Delete every posting for each affected entry, both legs,
            // before deleting the entry itself.
            List<UUID> entryIds = postingRepository.findAll().stream()
                    .filter(p -> p.getAccount().getId().equals(wallet.getId()))
                    .map(p -> p.getEntry().getId())
                    .distinct()
                    .toList();

            for (UUID entryId : entryIds) {
                postingRepository.deleteAll(postingRepository.findByEntryId(entryId));
                journalEntryRepository.deleteById(entryId);
            }
            accountRepository.deleteById(wallet.getId());
        });
    }

    @Test
    void balancedEntryUpdatesBothAccountBalances() {
        JournalEntry entry = ledgerService.post(
                "test-topup-" + testOwnerId, "TOPUP", null, null,
                List.of(PostingLine.debit(issuance.getId(), 50_000), PostingLine.credit(wallet.getId(), 50_000)));

        assertNotNull(entry.getId());

        Account refreshedWallet = accountRepository.findById(wallet.getId()).orElseThrow();
        assertEquals(50_000L, refreshedWallet.getBalanceMinor());
    }

    @Test
    void repeatedIdempotencyKeyDoesNotPostTwice() {
        String key = "test-idempotent-" + testOwnerId;
        List<PostingLine> lines = List.of(
                PostingLine.debit(issuance.getId(), 10_000), PostingLine.credit(wallet.getId(), 10_000));

        JournalEntry first = ledgerService.post(key, "TOPUP", null, null, lines);
        JournalEntry second = ledgerService.post(key, "TOPUP", null, null, lines);

        assertEquals(first.getId(), second.getId(), "replay must return the original entry, not a new one");

        Account refreshedWallet = accountRepository.findById(wallet.getId()).orElseThrow();
        assertEquals(10_000L, refreshedWallet.getBalanceMinor(), "balance must reflect exactly one posting, not two");
    }

    @Test
    void debitExceedingWalletBalanceIsRejectedAndLeavesBalanceUnchanged() {
        ApiException ex = assertThrows(ApiException.class, () -> ledgerService.post(
                "test-overdraft-" + testOwnerId, "P2P_TRANSFER", null, null,
                List.of(PostingLine.debit(wallet.getId(), 1_000), PostingLine.credit(issuance.getId(), 1_000))));

        assertTrue(ex.getMessage().contains("Insufficient balance"));

        Account refreshedWallet = accountRepository.findById(wallet.getId()).orElseThrow();
        assertEquals(0L, refreshedWallet.getBalanceMinor(), "a rejected debit must not partially apply");
    }

    @Test
    void unbalancedEntryIsRejectedByServiceBeforeTouchingTheDatabase() {
        ApiException ex = assertThrows(ApiException.class, () -> ledgerService.post(
                "test-unbalanced-" + testOwnerId, "TOPUP", null, null,
                List.of(PostingLine.debit(issuance.getId(), 5_000), PostingLine.credit(wallet.getId(), 4_000))));

        assertTrue(ex.getMessage().contains("not balanced"));
    }

    /**
     * Bypasses LedgerService entirely — writes an unbalanced pair of postings
     * directly through the repositories, the way a hypothetical future bug
     * might. This is the test that actually justifies the deferred constraint
     * trigger existing at all: LedgerService's own pre-check is not what's
     * under test here, since it's deliberately not being called.
     */
    @Test
    void databaseRejectsUnbalancedPostingsEvenWhenServiceLayerIsBypassed() {
        assertThrows(
                DataIntegrityViolationException.class,
                () -> newTransaction.executeWithoutResult(status -> {
                    JournalEntry entry = journalEntryRepository.save(JournalEntry.builder()
                            .idempotencyKey("test-bypass-" + testOwnerId)
                            .kind("TOPUP")
                            .build());

                    postingRepository.save(Posting.builder()
                            .entry(entry).account(issuance).direction(PostingDirection.DEBIT).amountMinor(9_000L).build());
                    postingRepository.save(Posting.builder()
                            .entry(entry).account(wallet).direction(PostingDirection.CREDIT).amountMinor(7_000L).build());
                    // Transaction commits here on scope exit — the deferred trigger
                    // fires at that point, not before, which is the entire reason
                    // this has to be a real transaction rather than a rolled-back one.
                }),
                "the deferred constraint trigger should refuse to commit an unbalanced entry");
    }

    /**
     * Two threads race to debit a wallet holding exactly enough for ONE of two
     * equal debits, not both. If the row-level locking in LedgerService.post()
     * works, exactly one thread succeeds and the other cleanly fails with
     * insufficient funds — the wallet never goes negative. If the locking is
     * broken, both could read the same "before" balance and both succeed,
     * which is precisely the double-spend bug this whole design exists to
     * prevent.
     */
    @Test
    void concurrentDebitsCannotBothSuceedPastTheAvailableBalance() throws Exception {
        // Fund the wallet with exactly one debit's worth, not two.
        ledgerService.post("test-concurrency-fund-" + testOwnerId, "TOPUP", null, null,
                List.of(PostingLine.debit(issuance.getId(), 1_000), PostingLine.credit(wallet.getId(), 1_000)));

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        AtomicInteger succeeded = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();

        Callable<Void> attemptDebit = () -> {
            barrier.await(10, TimeUnit.SECONDS); // both threads start together
            try {
                ledgerService.post(
                        "test-concurrency-debit-" + testOwnerId + "-" + Thread.currentThread().threadId(),
                        "P2P_TRANSFER", null, null,
                        List.of(PostingLine.debit(wallet.getId(), 1_000), PostingLine.credit(issuance.getId(), 1_000)));
                succeeded.incrementAndGet();
            } catch (ApiException e) {
                rejected.incrementAndGet();
            }
            return null;
        };

        List<Future<Void>> futures = pool.invokeAll(List.of(attemptDebit, attemptDebit));
        for (Future<Void> f : futures) {
            f.get(15, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertEquals(1, succeeded.get(), "exactly one of the two concurrent debits should succeed");
        assertEquals(1, rejected.get(), "exactly one should be cleanly rejected as insufficient funds");

        Account refreshedWallet = accountRepository.findById(wallet.getId()).orElseThrow();
        assertEquals(0L, refreshedWallet.getBalanceMinor(), "wallet must land at exactly zero, never negative");
    }
}
