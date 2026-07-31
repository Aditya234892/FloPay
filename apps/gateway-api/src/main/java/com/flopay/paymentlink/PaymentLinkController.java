package com.flopay.paymentlink;

import com.flopay.paymentlink.dto.PaymentLinkDtos.CreatePaymentLinkRequest;
import com.flopay.paymentlink.dto.PaymentLinkDtos.PayViaLinkRequest;
import com.flopay.paymentlink.dto.PaymentLinkDtos.PaymentLinkPreviewResponse;
import com.flopay.paymentlink.dto.PaymentLinkDtos.PaymentLinkResponse;
import com.flopay.security.SecurityUtils;
import com.flopay.transfer.dto.TransferDtos.TransferResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet/payment-links")
@RequiredArgsConstructor
public class PaymentLinkController {

    private final PaymentLinkService paymentLinkService;

    @PostMapping
    public ResponseEntity<PaymentLinkResponse> create(@Valid @RequestBody CreatePaymentLinkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentLinkService.create(SecurityUtils.currentUserId(), request));
    }

    @GetMapping
    public List<PaymentLinkResponse> list() {
        return paymentLinkService.listForUser(SecurityUtils.currentUserId());
    }

    @DeleteMapping("/{id}")
    public void disable(@PathVariable UUID id) {
        paymentLinkService.disable(SecurityUtils.currentUserId(), id);
    }

    /** Public — a link is only useful if it can be opened before the payer is known to be logged in. */
    @GetMapping("/{code}/preview")
    public PaymentLinkPreviewResponse preview(@PathVariable String code) {
        return paymentLinkService.preview(code);
    }

    @PostMapping("/{code}/pay")
    public TransferResponse pay(@PathVariable String code, @Valid @RequestBody PayViaLinkRequest request) {
        return paymentLinkService.pay(SecurityUtils.currentUserId(), code, request);
    }
}
