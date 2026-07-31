package com.flopay.merchantpay.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class MerchantPaymentDtos {

    private MerchantPaymentDtos() {
    }

    public record PayMerchantRequest(
            @NotBlank String merchantVpa,
            @Positive long amountMinor,
            @Size(max = 140) String note,
            /** Generated once client-side and reused on retry — same idempotency contract as a P2P transfer. */
            @NotBlank String idempotencyKey
    ) {
    }

    /** The consumer app's own view of a payment it just made. */
    public record MerchantPaymentResponse(
            String entryId,
            String merchantName,
            long amountMinor,
            String note,
            Instant createdAt
    ) {
    }

    /** The merchant dashboard's view of a payment it received. */
    public record MerchantWalletPaymentResponse(
            String id,
            String payerVpa,
            String payerDisplayName,
            long amountMinor,
            String note,
            Instant createdAt
    ) {
    }

    public record MerchantWalletSummaryResponse(
            long pendingMinor,
            long settledMinor,
            long totalReceivedMinor,
            long paymentCount
    ) {
    }
}
