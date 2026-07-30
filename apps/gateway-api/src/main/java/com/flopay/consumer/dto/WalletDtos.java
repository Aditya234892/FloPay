package com.flopay.consumer.dto;

import com.flopay.ledger.PostingDirection;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

public class WalletDtos {

    private WalletDtos() {
    }

    public record WalletResponse(String vpa, String displayName, long balanceMinor, String currency) {
    }

    public record TransactionResponse(
            String entryId,
            String kind,
            PostingDirection direction,
            long amountMinor,
            String referenceId,
            String note,
            /** The other party's VPA — null for entries with no personal counterparty (e.g. a top-up). */
            String counterpartyVpa,
            String counterpartyName,
            Instant createdAt
    ) {
    }

    public record TopUpRequest(
            /** Sandbox demo money only — capped so demo data stays sane, not a real product limit. */
            @Positive @Max(500_000) long amountMinor,
            @NotBlank String idempotencyKey
    ) {
    }
}
