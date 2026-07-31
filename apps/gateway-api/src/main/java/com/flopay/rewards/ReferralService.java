package com.flopay.rewards;

import com.flopay.common.ApiException;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.PostingLine;
import com.flopay.rewards.dto.ReferralDtos.ReferralSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

/**
 * A referral is redeemed at signup but only pays out once the referee
 * actually uses the app (their first P2P transfer) — otherwise "refer
 * yourself with a second phone number" would mint free money for nothing.
 */
@Service
@RequiredArgsConstructor
public class ReferralService {

    private static final String CURRENCY = "INR";
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** ₹25 to each side, paid once, when the referee's first transfer settles. */
    static final long REFERRAL_BONUS_MINOR = 2_500L;

    private final UserRepository userRepository;
    private final ReferralRepository referralRepository;
    private final LedgerService ledgerService;
    private final BadgeService badgeService;

    /** Called once at signup, alongside the placeholder VPA. */
    public String generateCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            code = sb.toString();
        } while (userRepository.existsByReferralCode(code));
        return code;
    }

    /**
     * Redeemed once, at profile completion — after this, the code field on
     * the profile-setup screen disappears, so there's no path to redeeming
     * twice or changing referrers after the fact.
     */
    @Transactional
    public void redeem(Long refereeUserId, String code) {
        if (referralRepository.findByRefereeUserId(refereeUserId).isPresent()) {
            throw ApiException.conflict("You've already used a referral code");
        }

        User referrer = userRepository.findByReferralCode(code.trim().toUpperCase())
                .orElseThrow(() -> ApiException.badRequest("That referral code doesn't exist"));
        if (referrer.getId().equals(refereeUserId)) {
            throw ApiException.badRequest("You can't refer yourself");
        }

        try {
            referralRepository.save(Referral.builder()
                    .referrerUserId(referrer.getId())
                    .refereeUserId(refereeUserId)
                    .status(ReferralStatus.PENDING)
                    .build());
        } catch (DataIntegrityViolationException alreadyReferred) {
            throw ApiException.conflict("You've already used a referral code");
        }
    }

    /**
     * Hooked into {@link com.flopay.transfer.TransferService#transfer} —
     * a no-op for the overwhelming majority of transfers (no pending
     * referral for that sender), so the lookup is a single indexed read.
     */
    @Transactional
    public void maybeRewardOnFirstTransfer(Long refereeUserId) {
        Referral referral = referralRepository.findByRefereeUserId(refereeUserId).orElse(null);
        if (referral == null || referral.getStatus() != ReferralStatus.PENDING) {
            return;
        }

        Account issuance = ledgerService.getAccount(AccountOwnerType.SYSTEM, Account.SYSTEM_OWNER_ID, AccountKind.ISSUANCE, CURRENCY);
        Account referrerRewards = ledgerService.getOrOpenAccount(AccountOwnerType.USER, referral.getReferrerUserId(), AccountKind.REWARDS, CURRENCY);
        Account refereeRewards = ledgerService.getOrOpenAccount(AccountOwnerType.USER, referral.getRefereeUserId(), AccountKind.REWARDS, CURRENCY);

        String idempotencyKey = "referral:" + referral.getId();
        ledgerService.post(
                idempotencyKey, "REFERRAL_BONUS", referral.getId().toString(), "Referral bonus",
                List.of(
                        PostingLine.debit(issuance.getId(), REFERRAL_BONUS_MINOR * 2),
                        PostingLine.credit(referrerRewards.getId(), REFERRAL_BONUS_MINOR),
                        PostingLine.credit(refereeRewards.getId(), REFERRAL_BONUS_MINOR)));

        referral.setStatus(ReferralStatus.REWARDED);
        referral.setRewardedAt(Instant.now());
        referralRepository.save(referral);

        badgeService.award(referral.getReferrerUserId(), BadgeType.REFERRAL_MASTER);
    }

    @Transactional(readOnly = true)
    public ReferralSummaryResponse summary(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        List<Referral> referrals = referralRepository.findByReferrerUserId(userId);
        long rewarded = referrals.stream().filter(r -> r.getStatus() == ReferralStatus.REWARDED).count();
        return new ReferralSummaryResponse(user.getReferralCode(), referrals.size(), rewarded, REFERRAL_BONUS_MINOR);
    }
}
