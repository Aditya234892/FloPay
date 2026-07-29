package com.flopay.payment;

import com.flopay.payment.dto.PaymentDtos.CreatePaymentRequest;
import com.flopay.payment.dto.PaymentDtos.PaymentResponse;
import com.flopay.payment.dto.PaymentDtos.VerifyPaymentRequest;
import com.flopay.payment.dto.PaymentDtos.VerifyPaymentResponse;
import com.flopay.security.ApiKeyAuthFilter;
import com.flopay.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/api/v1/payments")
    public ResponseEntity<PaymentResponse> create(
            @Valid @RequestBody CreatePaymentRequest request, HttpServletRequest httpRequest
    ) {
        String secret = (String) httpRequest.getAttribute(ApiKeyAuthFilter.API_KEY_SECRET_ATTR);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createPayment(SecurityUtils.currentMerchantId(), secret, request));
    }

    @PostMapping("/api/v1/payments/verify")
    public VerifyPaymentResponse verify(
            @Valid @RequestBody VerifyPaymentRequest request, HttpServletRequest httpRequest
    ) {
        String secret = (String) httpRequest.getAttribute(ApiKeyAuthFilter.API_KEY_SECRET_ATTR);
        boolean valid = paymentService.verify(SecurityUtils.currentMerchantId(), secret, request);
        return new VerifyPaymentResponse(valid);
    }

    @GetMapping("/api/v1/payments/{paymentId}")
    public PaymentResponse get(@PathVariable String paymentId) {
        return paymentService.getPayment(SecurityUtils.currentMerchantId(), paymentId);
    }

    /** Dashboard-facing (JWT-authenticated) read of a merchant's payments. */
    @GetMapping("/api/dashboard/payments")
    public List<PaymentResponse> listForDashboard() {
        return paymentService.listPayments(SecurityUtils.currentMerchantId());
    }
}
