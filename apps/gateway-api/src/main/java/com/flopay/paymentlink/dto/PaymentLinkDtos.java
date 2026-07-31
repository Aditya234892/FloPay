package com.flopay.paymentlink.dto;

import com.flopay.paymentlink.PaymentLinkStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class PaymentLinkDtos {

    private PaymentLinkDtos() {
    }

    public record CreatePaymentLinkRequest(
            /** Null makes an open-amount link — the payer chooses how much to send. */
            @Positive Long amountMinor,
            @Size(max = 140) String note
    ) {
    }

    public record PaymentLinkResponse(
            String id,
            String code,
            Long amountMinor,
            String note,
            PaymentLinkStatus status,
            Instant createdAt
    ) {
    }

    /** Public view — shown before the payer is asked to pay, no balance/wallet info leaks. */
    public record PaymentLinkPreviewResponse(
            String code,
            String creatorVpa,
            String creatorDisplayName,
            Long amountMinor,
            String note,
            boolean active
    ) {
    }

    public record PayViaLinkRequest(
            /** Required only when the link itself has no fixed amount. */
            @Positive Long amountMinor,
            @NotBlank String idempotencyKey
    ) {
    }
}
