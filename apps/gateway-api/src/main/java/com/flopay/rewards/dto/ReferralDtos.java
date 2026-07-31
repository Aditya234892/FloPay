package com.flopay.rewards.dto;

public class ReferralDtos {

    private ReferralDtos() {
    }

    public record ReferralSummaryResponse(
            String referralCode,
            long totalReferred,
            long rewardedCount,
            long bonusMinorPerReferral
    ) {
    }
}
