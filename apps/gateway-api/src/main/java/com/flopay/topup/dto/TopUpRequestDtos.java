package com.flopay.topup.dto;

import com.flopay.topup.TopUpRequestStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class TopUpRequestDtos {

    private TopUpRequestDtos() {
    }

    public record CreateTopUpRequest(
            /** Sandbox demo money only — capped so demo data stays sane, not a real product limit. */
            @Positive @Max(500_000) long amountMinor,
            @Size(max = 140) String note
    ) {
    }

    public record TopUpRequestResponse(
            String id,
            long amountMinor,
            String note,
            TopUpRequestStatus status,
            Instant createdAt,
            Instant decidedAt
    ) {
    }

    /** The admin queue additionally needs to know whose wallet this credits. */
    public record AdminTopUpRequestResponse(
            String id,
            Long userId,
            String userVpa,
            String userDisplayName,
            long amountMinor,
            String note,
            TopUpRequestStatus status,
            Instant createdAt,
            Instant decidedAt
    ) {
    }
}
