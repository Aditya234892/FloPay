package com.flopay.transfer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class TransferDtos {

    private TransferDtos() {
    }

    public record TransferRequest(
            @NotBlank String toVpa,
            @Positive long amountMinor,
            @Size(max = 140) String note,
            /**
             * Generated once by the client when the user taps "Send", and
             * reused verbatim on any retry of that same attempt (a network
             * timeout, a double-tap). Without this, a retried request would
             * look identical to a second, deliberate transfer and there would
             * be no way to tell them apart server-side.
             */
            @NotBlank String idempotencyKey
    ) {
    }

    public record TransferResponse(
            String entryId,
            String toVpa,
            String toName,
            long amountMinor,
            String note,
            Instant createdAt
    ) {
    }
}
