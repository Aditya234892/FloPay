package com.flopay.transfer;

import com.flopay.common.ApiException;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.JournalEntry;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.PostingLine;
import com.flopay.transfer.dto.TransferDtos.TransferRequest;
import com.flopay.transfer.dto.TransferDtos.TransferResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final String CURRENCY = "INR";

    private final UserRepository userRepository;
    private final LedgerService ledgerService;

    public TransferResponse transfer(Long senderUserId, TransferRequest request) {
        User receiver = userRepository.findByVpa(request.toVpa())
                .orElseThrow(() -> ApiException.badRequest("No FloPay user with that VPA"));

        if (receiver.getId().equals(senderUserId)) {
            throw ApiException.badRequest("You can't send money to yourself");
        }

        Account senderWallet = ledgerService.getAccount(AccountOwnerType.USER, senderUserId, AccountKind.WALLET, CURRENCY);
        Account receiverWallet = ledgerService.getAccount(AccountOwnerType.USER, receiver.getId(), AccountKind.WALLET, CURRENCY);

        JournalEntry entry = ledgerService.post(
                request.idempotencyKey(), "P2P_TRANSFER", null, request.note(),
                List.of(
                        PostingLine.debit(senderWallet.getId(), request.amountMinor()),
                        PostingLine.credit(receiverWallet.getId(), request.amountMinor())));

        return new TransferResponse(
                entry.getId().toString(), receiver.getVpa(), receiver.getDisplayName(),
                request.amountMinor(), request.note(), entry.getCreatedAt());
    }
}
