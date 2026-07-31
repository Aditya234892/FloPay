package com.flopay.merchantpay;

import com.flopay.merchantpay.dto.MerchantPaymentDtos.MerchantWalletPaymentResponse;
import com.flopay.merchantpay.dto.MerchantPaymentDtos.MerchantWalletSummaryResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Merchant dashboard side — payments received from wallet users. */
@RestController
@RequestMapping("/api/dashboard/wallet-payments")
@RequiredArgsConstructor
public class MerchantWalletController {

    private final MerchantPaymentService merchantPaymentService;

    @GetMapping
    public List<MerchantWalletPaymentResponse> list() {
        return merchantPaymentService.listForMerchant(SecurityUtils.currentMerchantId());
    }

    @GetMapping("/summary")
    public MerchantWalletSummaryResponse summary() {
        return merchantPaymentService.summary(SecurityUtils.currentMerchantId());
    }
}
