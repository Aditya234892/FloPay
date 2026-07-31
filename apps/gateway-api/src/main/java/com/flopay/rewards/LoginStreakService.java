package com.flopay.rewards;

import com.flopay.common.ApiException;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.PostingLine;
import com.flopay.rewards.dto.LoginStreakDtos.CheckInResponse;
import com.flopay.rewards.dto.LoginStreakDtos.StreakStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * A daily "claim your bonus" check-in, not a silent background credit — the
 * user taps to claim, same reasoning as a real app's daily-reward UI: the
 * moment needs to be visible or the reward doesn't register as a reward.
 * Days are UTC calendar days; the app has no other per-user timezone
 * concept to hang this off of.
 */
@Service
@RequiredArgsConstructor
public class LoginStreakService {

    private static final String CURRENCY = "INR";
    private static final long DAILY_BONUS_MINOR = 500L;
    private static final long WEEKLY_BONUS_MINOR = 2_500L;
    private static final int WEEKLY_MILESTONE = 7;

    private final LoginStreakRepository loginStreakRepository;
    private final LedgerService ledgerService;
    private final BadgeService badgeService;

    @Transactional(readOnly = true)
    public StreakStatusResponse status(Long userId) {
        LoginStreak streak = loginStreakRepository.findById(userId).orElse(null);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        boolean checkedInToday = streak != null && today.equals(streak.getLastCheckIn());

        int currentStreak = streak != null ? streak.getCurrentStreak() : 0;
        int longestStreak = streak != null ? streak.getLongestStreak() : 0;
        int streakIfClaimedNow = nextStreakValue(streak, today);

        return new StreakStatusResponse(currentStreak, longestStreak, checkedInToday, bonusFor(streakIfClaimedNow));
    }

    @Transactional
    public CheckInResponse checkIn(Long userId) {
        LoginStreak streak = loginStreakRepository.findById(userId)
                .orElseGet(() -> LoginStreak.builder().userId(userId).build());

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (today.equals(streak.getLastCheckIn())) {
            throw ApiException.conflict("Already checked in today — come back tomorrow");
        }

        int newStreak = nextStreakValue(streak, today);
        streak.setCurrentStreak(newStreak);
        streak.setLongestStreak(Math.max(streak.getLongestStreak(), newStreak));
        streak.setLastCheckIn(today);
        loginStreakRepository.save(streak);

        long bonus = bonusFor(newStreak);
        Account issuance = ledgerService.getAccount(AccountOwnerType.SYSTEM, Account.SYSTEM_OWNER_ID, AccountKind.ISSUANCE, CURRENCY);
        Account rewards = ledgerService.getOrOpenAccount(AccountOwnerType.USER, userId, AccountKind.REWARDS, CURRENCY);

        ledgerService.post(
                "streak-checkin:" + userId + ":" + today, "STREAK_CHECKIN", userId.toString(),
                newStreak % WEEKLY_MILESTONE == 0 ? "Day " + newStreak + " streak bonus" : "Daily check-in bonus",
                List.of(PostingLine.debit(issuance.getId(), bonus), PostingLine.credit(rewards.getId(), bonus)));

        if (newStreak % WEEKLY_MILESTONE == 0) {
            badgeService.award(userId, BadgeType.WEEK_STREAK);
        }

        return new CheckInResponse(newStreak, streak.getLongestStreak(), bonus);
    }

    /** A gap of more than one day resets to 1; consecutive-day or first-ever check-in extends/starts the streak. */
    private int nextStreakValue(LoginStreak streak, LocalDate today) {
        if (streak == null || streak.getLastCheckIn() == null) {
            return 1;
        }
        if (streak.getLastCheckIn().equals(today)) {
            return streak.getCurrentStreak();
        }
        if (streak.getLastCheckIn().equals(today.minusDays(1))) {
            return streak.getCurrentStreak() + 1;
        }
        return 1;
    }

    private long bonusFor(int streakValue) {
        return streakValue % WEEKLY_MILESTONE == 0 ? DAILY_BONUS_MINOR + WEEKLY_BONUS_MINOR : DAILY_BONUS_MINOR;
    }
}
