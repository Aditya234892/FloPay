package com.flopay.rewards;

import com.flopay.common.ApiException;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.PostingLine;
import com.flopay.ledger.PostingRepository;
import com.flopay.rewards.dto.RewardsDtos.RewardHistoryEntry;
import com.flopay.rewards.dto.RewardsDtos.RewardsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Cashback, minted the same way a top-up is (from ISSUANCE), and tracked as
 * its own ledger account rather than a bare counter — this app's rule is
 * "money movement always goes through the ledger," and reward points are
 * still a balance a user can look at and expect to reconcile.
 */
@Service
@RequiredArgsConstructor
public class RewardsService {

    private static final String CURRENCY = "INR";

    /** 1% cashback on money sent (not received, not topped up — this rewards spending). */
    private static final double CASHBACK_RATE = 0.01;

    private final LedgerService ledgerService;
    private final PostingRepository postingRepository;

    /**
     * Zero-amount cashback is skipped rather than posted — the ledger
     * requires postings to be strictly positive (see V2__ledger.sql), and a
     * sub-paisa reward on a tiny transfer would otherwise throw instead of
     * just... not awarding anything.
     */
    @Transactional
    public void awardCashback(Long userId, long transferAmountMinor, String sourceEntryId) {
        long cashback = Math.round(transferAmountMinor * CASHBACK_RATE);
        if (cashback <= 0) {
            return;
        }

        Account issuance = ledgerService.getAccount(AccountOwnerType.SYSTEM, Account.SYSTEM_OWNER_ID, AccountKind.ISSUANCE, CURRENCY);
        Account rewards = getOrCreateRewardsAccount(userId);

        ledgerService.post(
                "cashback:" + sourceEntryId, "CASHBACK_REWARD", sourceEntryId, "1% cashback",
                List.of(PostingLine.debit(issuance.getId(), cashback), PostingLine.credit(rewards.getId(), cashback)));
    }

    @Transactional(readOnly = true)
    public RewardsResponse getBalance(Long userId) {
        try {
            Account rewards = ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.REWARDS, CURRENCY);
            return new RewardsResponse(rewards.getBalanceMinor(), rewards.getCurrency());
        } catch (ApiException notFound) {
            // No cashback earned yet — the account is created lazily on the
            // first award, not at signup, so "none yet" is ₹0, not an error.
            return new RewardsResponse(0L, CURRENCY);
        }
    }

    @Transactional(readOnly = true)
    public List<RewardHistoryEntry> getHistory(Long userId) {
        try {
            Account rewards = ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.REWARDS, CURRENCY);
            return postingRepository.findTop50ByAccountIdOrderByIdDesc(rewards.getId()).stream()
                    .map(p -> new RewardHistoryEntry(p.getAmountMinor(), p.getEntry().getNote(), p.getEntry().getCreatedAt()))
                    .toList();
        } catch (ApiException notFound) {
            return List.of();
        }
    }

    /**
     * Existing users (from before this feature existed) don't have a REWARDS
     * account yet — created lazily on first use. Not safe against two
     * concurrent first-cashback-events for the same user racing each other
     * (same documented, accepted limitation as
     * {@link com.flopay.consumer.ConsumerAuthService#verifyOtp}) — acceptable
     * here because the loser just gets a DataIntegrityViolationException on a
     * genuinely rare race, not a wrong balance.
     */
    private Account getOrCreateRewardsAccount(Long userId) {
        try {
            return ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.REWARDS, CURRENCY);
        } catch (ApiException notFound) {
            try {
                return ledgerService.openAccount(AccountOwnerType.USER, userId, AccountKind.REWARDS, CURRENCY);
            } catch (DataIntegrityViolationException raceLost) {
                return ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.REWARDS, CURRENCY);
            }
        }
    }
}
