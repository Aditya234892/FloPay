package com.flopay.refund;

import com.flopay.common.ApiException;
import com.flopay.common.IdGenerator;
import com.flopay.payment.Payment;
import com.flopay.payment.PaymentRepository;
import com.flopay.payment.PaymentStatus;
import com.flopay.refund.dto.RefundDtos.CreateRefundRequest;
import com.flopay.refund.dto.RefundDtos.RefundResponse;
import com.flopay.webhook.WebhookDispatcher;
import com.flopay.webhook.WebhookEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final WebhookDispatcher webhookDispatcher;

    @Transactional
    public RefundResponse createRefund(Long merchantId, String paymentId, CreateRefundRequest request) {
        Payment payment = paymentRepository.findByIdAndOrderMerchantId(paymentId, merchantId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));

        if (payment.getStatus() != PaymentStatus.CAPTURED && payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw ApiException.conflict("Only captured payments can be refunded");
        }

        long alreadyRefunded = refundRepository.findByPaymentId(paymentId).stream()
                .mapToLong(Refund::getAmount)
                .sum();
        long remaining = payment.getAmount() - alreadyRefunded;
        long refundAmount = request.amount() != null ? request.amount() : remaining;

        if (refundAmount <= 0 || refundAmount > remaining) {
            throw ApiException.badRequest("Refund amount exceeds the remaining captured balance");
        }

        Refund refund = Refund.builder()
                .id(IdGenerator.generate("rfnd_"))
                .payment(payment)
                .amount(refundAmount)
                .status(RefundStatus.PROCESSED)
                .build();
        refund = refundRepository.save(refund);

        payment.setStatus(refundAmount == remaining ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED);
        paymentRepository.save(payment);

        RefundResponse response = RefundResponse.from(refund);
        webhookDispatcher.dispatch(merchantId, WebhookEventType.REFUND_PROCESSED, response);
        return response;
    }

    public List<RefundResponse> listForPayment(Long merchantId, String paymentId) {
        paymentRepository.findByIdAndOrderMerchantId(paymentId, merchantId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));
        return refundRepository.findByPaymentId(paymentId).stream().map(RefundResponse::from).toList();
    }

    public List<RefundResponse> listForDashboard(Long merchantId) {
        return refundRepository.findByPaymentOrderMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(RefundResponse::from)
                .toList();
    }
}
