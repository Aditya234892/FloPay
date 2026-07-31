package com.flopay.rewards.dto;

import java.time.Instant;

public class RewardsDtos {

    private RewardsDtos() {
    }

    public record RewardsResponse(long balanceMinor, String currency) {
    }

    public record RewardHistoryEntry(long amountMinor, String note, Instant createdAt) {
    }
}
