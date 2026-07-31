package com.flopay.consumer;

import com.flopay.consumer.dto.WalletDtos.TransactionResponse;
import com.flopay.consumer.dto.WalletDtos.WalletResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * There is deliberately no instant self-serve top-up endpoint here — "Add
 * money" goes through {@link com.flopay.topup.TopUpRequestController} and an
 * admin has to approve it. {@link WalletService#topUp} still exists as the
 * actual crediting mechanism, called from
 * {@link com.flopay.topup.TopUpRequestService#approve}.
 */
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
}
