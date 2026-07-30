package com.flopay.payment.dto;

import com.flopay.payment.Payment;
import com.flopay.payment.PaymentMethod;
import com.flopay.payment.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class PaymentDtos {

    private PaymentDtos() {
    }

    public record CreatePaymentRequest(
            @NotBlank String orderId,
            @NotNull PaymentMethod method,
            /** Card number, UPI VPA, or bank code — all fake, format-checked only, never real financial data. */
            @NotBlank String instrument
    ) {
    }

    public record PaymentResponse(
            String id,
            String orderId,
            PaymentMethod method,
            PaymentStatus status,
            Long amount,
            String signature,
            String failureReason,
            Instant createdAt
    ) {
        public static PaymentResponse from(Payment payment) {
            return new PaymentResponse(
                    payment.getId(), payment.getOrder().getId(), payment.getMethod(), payment.getStatus(),
                    payment.getAmount(), payment.getSignature(), payment.getFailureReason(), payment.getCreatedAt()
            );
        }
    }

    public record VerifyPaymentRequest(
            @NotBlank String orderId,
            @NotBlank String paymentId,
            @NotBlank String signature
    ) {
    }

    public record VerifyPaymentResponse(boolean valid) {
    }
}
