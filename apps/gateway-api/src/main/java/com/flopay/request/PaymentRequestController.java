package com.flopay.request;

import com.flopay.request.dto.PaymentRequestDtos.CreateRequestRequest;
import com.flopay.request.dto.PaymentRequestDtos.CreateSplitRequest;
import com.flopay.request.dto.PaymentRequestDtos.PaymentRequestResponse;
import com.flopay.request.dto.PaymentRequestDtos.SplitSummaryResponse;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet/requests")
@RequiredArgsConstructor
public class PaymentRequestController {

    private final PaymentRequestService paymentRequestService;

    @PostMapping
    public ResponseEntity<PaymentRequestResponse> create(@Valid @RequestBody CreateRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentRequestService.create(
                SecurityUtils.currentUserId(), request.fromVpa(), request.amountMinor(), request.note()));
    }

    @PostMapping("/split")
    public ResponseEntity<SplitSummaryResponse> createSplit(@Valid @RequestBody CreateSplitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentRequestService.createSplit(SecurityUtils.currentUserId(), request));
    }

    /** Requests where the caller is being asked to pay. */
    @GetMapping("/incoming")
    public List<PaymentRequestResponse> incoming() {
        return paymentRequestService.listIncoming(SecurityUtils.currentUserId());
    }

    /** Lightweight count for a home-screen badge — avoids fetching the full list just to show a number. */
    @GetMapping("/incoming/pending-count")
    public Map<String, Long> incomingPendingCount() {
        return Map.of("count", paymentRequestService.countPendingIncoming(SecurityUtils.currentUserId()));
    }

    /** Requests the caller has sent to others. */
    @GetMapping("/outgoing")
    public List<PaymentRequestResponse> outgoing() {
        return paymentRequestService.listOutgoing(SecurityUtils.currentUserId());
    }

    @PostMapping("/{requestId}/approve")
    public PaymentRequestResponse approve(@PathVariable UUID requestId) {
        return paymentRequestService.approve(SecurityUtils.currentUserId(), requestId);
    }

    @PostMapping("/{requestId}/decline")
    public PaymentRequestResponse decline(@PathVariable UUID requestId) {
        return paymentRequestService.decline(SecurityUtils.currentUserId(), requestId);
    }

    @PostMapping("/{requestId}/cancel")
    public PaymentRequestResponse cancel(@PathVariable UUID requestId) {
        return paymentRequestService.cancel(SecurityUtils.currentUserId(), requestId);
    }
}
