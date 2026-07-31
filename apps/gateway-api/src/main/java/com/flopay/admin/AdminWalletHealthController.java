package com.flopay.admin;

import com.flopay.admin.dto.WalletHealthResponse;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountRepository;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Gated by {@link SecurityUtils#requireAdminMerchant()}. */
@RestController
@RequestMapping("/api/dashboard/admin/wallet-health")
@RequiredArgsConstructor
public class AdminWalletHealthController {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @GetMapping
    public WalletHealthResponse health() {
        SecurityUtils.requireAdminMerchant();

        long wallet = accountRepository.sumBalanceByKind(AccountKind.WALLET);
        long settlementPending = accountRepository.sumBalanceByKind(AccountKind.SETTLEMENT_PENDING);
        long settled = accountRepository.sumBalanceByKind(AccountKind.SETTLED);
        long issuance = accountRepository.sumBalanceByKind(AccountKind.ISSUANCE);
        long fees = accountRepository.sumBalanceByKind(AccountKind.FEES);
        long rewards = accountRepository.sumBalanceByKind(AccountKind.REWARDS);

        long net = wallet + settlementPending + settled + issuance + fees + rewards;

        return new WalletHealthResponse(
                wallet, settlementPending, settled, issuance, fees, rewards, net, net == 0,
                userRepository.count(), userRepository.countByFrozenTrue());
    }
}
