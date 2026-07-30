package com.flopay.consumer;

import com.flopay.common.ApiException;
import com.flopay.consumer.dto.WalletDtos.TransactionResponse;
import com.flopay.consumer.dto.WalletDtos.WalletResponse;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.PostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final PostingRepository postingRepository;

    public WalletResponse getWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        Account wallet = ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.WALLET, "INR");

        return new WalletResponse(user.getVpa(), user.getDisplayName(), wallet.getBalanceMinor(), wallet.getCurrency());
    }

    public List<TransactionResponse> getTransactions(Long userId) {
        Account wallet = ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.WALLET, "INR");

        return postingRepository.findTop50ByAccountIdOrderByIdDesc(wallet.getId()).stream()
                .map(posting -> new TransactionResponse(
                        posting.getEntry().getId().toString(),
                        posting.getEntry().getKind(),
                        posting.getDirection(),
                        posting.getAmountMinor(),
                        posting.getEntry().getReferenceId(),
                        posting.getEntry().getCreatedAt()))
                .toList();
    }
}
