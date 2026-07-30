package com.flopay.consumer;

import com.flopay.consumer.dto.WalletDtos.TopUpRequest;
import com.flopay.consumer.dto.WalletDtos.TransactionResponse;
import com.flopay.consumer.dto.WalletDtos.WalletResponse;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public WalletResponse getWallet() {
        return walletService.getWallet(SecurityUtils.currentUserId());
    }

    @GetMapping("/transactions")
    public List<TransactionResponse> getTransactions() {
        return walletService.getTransactions(SecurityUtils.currentUserId());
    }

    /** Sandbox only — see {@link WalletService#topUp}. */
    @PostMapping("/topup")
    public WalletResponse topUp(@Valid @RequestBody TopUpRequest request) {
        return walletService.topUp(SecurityUtils.currentUserId(), request.amountMinor(), request.idempotencyKey());
    }
}
