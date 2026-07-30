package com.flopay.request.dto;

import com.flopay.request.PaymentRequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public class PaymentRequestDtos {

    private PaymentRequestDtos() {
    }

    public record CreateRequestRequest(
            @NotBlank String fromVpa,
            @Positive long amountMinor,
            @Size(max = 140) String note
    ) {
    }

    public record CreateSplitRequest(
            /** The whole bill. Each payer's share is derived from this, never supplied directly. */
            @Positive long totalAmountMinor,
            /**
             * Everyone being asked to pay, excluding the creator. The creator's
             * own share is implicit — they are collecting, not paying
             * themselves.
             */
            @NotEmpty List<@NotBlank String> payerVpas,
            @Size(max = 140) String note
    ) {
    }

    public record PaymentRequestResponse(
            String id,
            /** From the caller's point of view: are they being asked, or asking? */
            boolean incoming,
            String counterpartyVpa,
            String counterpartyName,
            long amountMinor,
            String note,
            PaymentRequestStatus status,
            String splitGroupId,
            Instant createdAt
    ) {
    }

    public record SplitSummaryResponse(
            String splitGroupId,
            long totalAmountMinor,
            String note,
            List<PaymentRequestResponse> shares
    ) {
    }
}
