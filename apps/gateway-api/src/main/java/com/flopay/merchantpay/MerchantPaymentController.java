package com.flopay.merchantpay;

import com.flopay.merchantpay.dto.MerchantPaymentDtos.MerchantPaymentResponse;
import com.flopay.merchantpay.dto.MerchantPaymentDtos.PayMerchantRequest;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Consumer wallet app side — paying a merchant's VPA. */
@RestController
@RequestMapping("/api/wallet/merchant-payments")
@RequiredArgsConstructor
public class MerchantPaymentController {

    private final MerchantPaymentService merchantPaymentService;

    @PostMapping
    public ResponseEntity<MerchantPaymentResponse> pay(@Valid @RequestBody PayMerchantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(merchantPaymentService.pay(SecurityUtils.currentUserId(), request));
    }
}
