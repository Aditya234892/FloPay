package com.flopay.payment;

import com.flopay.common.ApiException;
import com.flopay.common.IdGenerator;
import com.flopay.order.Order;
import com.flopay.order.OrderRepository;
import com.flopay.order.OrderStatus;
import com.flopay.payment.dto.PaymentDtos.CreatePaymentRequest;
import com.flopay.payment.dto.PaymentDtos.PaymentResponse;
import com.flopay.payment.dto.PaymentDtos.VerifyPaymentRequest;
import com.flopay.webhook.WebhookDispatcher;
import com.flopay.webhook.WebhookEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final TestCardSimulator testCardSimulator;
    private final WebhookDispatcher webhookDispatcher;

    @Transactional
    public PaymentResponse createPayment(Long merchantId, String apiKeySecretPlain, CreatePaymentRequest request) {
        Order order = orderRepository.findByIdAndMerchantId(request.orderId(), merchantId)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.getStatus() == OrderStatus.PAID) {
            throw ApiException.conflict("Order has already been paid");
        }

        order.setStatus(OrderStatus.ATTEMPTED);
        orderRepository.save(order);

        var outcome = testCardSimulator.simulate(request.method(), request.instrument());

        Payment payment = Payment.builder()
                .id(IdGenerator.generate("pay_"))
                .order(order)
                .method(request.method())
                .amount(order.getAmount())
                .status(outcome.success() ? PaymentStatus.CAPTURED : PaymentStatus.FAILED)
                .failureReason(outcome.success() ? null : outcome.reason())
                .capturedAt(outcome.success() ? Instant.now() : null)
                .build();

        if (outcome.success()) {
            String secret = resolveSigningSecret(merchantId, apiKeySecretPlain);
            payment.setSignature(SignatureUtil.sign(order.getId() + "|" + payment.getId(), secret));
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
        }

        payment = paymentRepository.save(payment);

        webhookDispatcher.dispatch(
                merchantId,
                outcome.success() ? WebhookEventType.PAYMENT_CAPTURED : WebhookEventType.PAYMENT_FAILED,
                PaymentResponse.from(payment)
        );

        return PaymentResponse.from(payment);
    }

    public boolean verify(Long merchantId, String apiKeySecretPlain, VerifyPaymentRequest request) {
        Payment payment = paymentRepository.findByIdAndOrderMerchantId(request.paymentId(), merchantId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));
        if (!payment.getOrder().getId().equals(request.orderId())) {
            return false;
        }
        String secret = resolveSigningSecret(merchantId, apiKeySecretPlain);
        String expected = SignatureUtil.sign(request.orderId() + "|" + request.paymentId(), secret);
        return java.security.MessageDigest.isEqual(
                expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                request.signature().getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }

    public PaymentResponse getPayment(Long merchantId, String paymentId) {
        return PaymentResponse.from(
                paymentRepository.findByIdAndOrderMerchantId(paymentId, merchantId)
                        .orElseThrow(() -> ApiException.notFound("Payment not found"))
        );
    }

    public List<PaymentResponse> listPayments(Long merchantId) {
        return paymentRepository.findByOrderMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    Payment findOwned(Long merchantId, String paymentId) {
        return paymentRepository.findByIdAndOrderMerchantId(paymentId, merchantId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));
    }

    /**
     * Signing requires the plaintext key_secret. If the current request already carried it (API-key auth),
     * use it directly; otherwise (e.g. a dashboard/JWT-authenticated call) fall back to the merchant's
     * most recently created active key so verification still works from the dashboard.
     */
    private String resolveSigningSecret(Long merchantId, String apiKeySecretPlain) {
        if (apiKeySecretPlain != null && !apiKeySecretPlain.isBlank()) {
            return apiKeySecretPlain;
        }
        throw ApiException.badRequest(
                "Signature operations require API-key authentication (Basic Auth with key_id/key_secret)"
        );
    }
}
