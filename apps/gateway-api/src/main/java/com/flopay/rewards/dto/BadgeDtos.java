package com.flopay.rewards.dto;

import java.time.Instant;

public class BadgeDtos {

    private BadgeDtos() {
    }

    public record BadgeResponse(
            String type,
            String title,
            String description,
            boolean earned,
            Instant earnedAt
    ) {
    }
}
