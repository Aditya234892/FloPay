package com.flopay.merchantpay.settlement;

import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.AccountRepository;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.PostingLine;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * A simplified settlement batch: on each run, every merchant's *entire*
 * current SETTLEMENT_PENDING balance moves to SETTLED in one entry. A real
 * processor tracks a hold period per captured payment (T+2 days, released
 * individually); this collapses that into "whatever's pending when the job
 * runs, settles now" — enough to demonstrate the SETTLEMENT_PENDING →
 * SETTLED lifecycle without a second holds table.
 */
@Service
@RequiredArgsConstructor
public class SettlementService {

    private static final Logger log = LoggerFactory.getLogger(SettlementService.class);
    private static final String CURRENCY = "INR";

    private final AccountRepository accountRepository;
    private final LedgerService ledgerService;

    @Transactional
    public void runSettlementBatch(Instant runAt) {
        List<Account> duePending = accountRepository.findByOwnerTypeAndKindAndBalanceMinorGreaterThan(
                AccountOwnerType.MERCHANT, AccountKind.SETTLEMENT_PENDING, 0L);

        for (Account pending : duePending) {
            settleOne(pending, runAt);
        }
    }

    private void settleOne(Account pending, Instant runAt) {
        long amount = pending.getBalanceMinor();
        Account settled = ledgerService.getOrOpenAccount(
                AccountOwnerType.MERCHANT, pending.getOwnerId(), AccountKind.SETTLED, CURRENCY);

        String idempotencyKey = "settlement:" + pending.getOwnerId() + ":" + runAt;
        try {
            ledgerService.post(
                    idempotencyKey, "SETTLEMENT", pending.getOwnerId().toString(), null,
                    List.of(
                            PostingLine.debit(pending.getId(), amount),
                            PostingLine.credit(settled.getId(), amount)));
        } catch (Exception e) {
            // One merchant's settlement failing (e.g. a balance changed under
            // the batch) must not stop the rest of the batch from running.
            log.warn("Settlement failed for merchant {}: {}", pending.getOwnerId(), e.getMessage());
        }
    }
}
