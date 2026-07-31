package com.flopay.rewards.dto;

public class LoginStreakDtos {

    private LoginStreakDtos() {
    }

    public record StreakStatusResponse(
            int currentStreak,
            int longestStreak,
            boolean checkedInToday,
            long nextBonusMinor
    ) {
    }

    public record CheckInResponse(
            int currentStreak,
            int longestStreak,
            long bonusMinor
    ) {
    }
}
