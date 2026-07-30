package com.flopay.refund.dto;

import com.flopay.refund.Refund;
import com.flopay.refund.RefundStatus;
import jakarta.validation.constraints.Min;

import java.time.Instant;

public class RefundDtos {

    private RefundDtos() {
    }

    /** amount is optional — omit for a full refund of the remaining captured balance. */
    public record CreateRefundRequest(@Min(1) Long amount) {
    }

    public record RefundResponse(
            String id,
            String paymentId,
            Long amount,
            RefundStatus status,
            Instant createdAt
    ) {
        public static RefundResponse from(Refund refund) {
            return new RefundResponse(
                    refund.getId(), refund.getPayment().getId(), refund.getAmount(),
                    refund.getStatus(), refund.getCreatedAt()
            );
        }
    }
}
