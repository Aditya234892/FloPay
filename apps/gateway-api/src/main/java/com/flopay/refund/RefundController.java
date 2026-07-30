package com.flopay.refund;

import com.flopay.refund.dto.RefundDtos.CreateRefundRequest;
import com.flopay.refund.dto.RefundDtos.RefundResponse;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping("/api/v1/payments/{paymentId}/refund")
    public ResponseEntity<RefundResponse> create(
            @PathVariable String paymentId, @Valid @RequestBody(required = false) CreateRefundRequest request
    ) {
        CreateRefundRequest body = request != null ? request : new CreateRefundRequest(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(refundService.createRefund(SecurityUtils.currentMerchantId(), paymentId, body));
    }

    @GetMapping("/api/v1/payments/{paymentId}/refunds")
    public List<RefundResponse> listForPayment(@PathVariable String paymentId) {
        return refundService.listForPayment(SecurityUtils.currentMerchantId(), paymentId);
    }

    /** Dashboard-facing (JWT-authenticated) read of a merchant's refunds. */
    @GetMapping("/api/dashboard/refunds")
    public List<RefundResponse> listForDashboard() {
        return refundService.listForDashboard(SecurityUtils.currentMerchantId());
    }

    /** Lets a logged-in merchant issue a refund from the dashboard UI, without needing an API secret. */
    @PostMapping("/api/dashboard/payments/{paymentId}/refund")
    public ResponseEntity<RefundResponse> createFromDashboard(
            @PathVariable String paymentId, @Valid @RequestBody(required = false) CreateRefundRequest request
    ) {
        CreateRefundRequest body = request != null ? request : new CreateRefundRequest(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(refundService.createRefund(SecurityUtils.currentMerchantId(), paymentId, body));
    }
}
