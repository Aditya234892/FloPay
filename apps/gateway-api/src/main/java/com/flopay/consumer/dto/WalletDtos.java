package com.flopay.consumer.dto;

import com.flopay.ledger.PostingDirection;

import java.time.Instant;

public class WalletDtos {

    private WalletDtos() {
    }

    public record WalletResponse(String vpa, String displayName, long balanceMinor, String currency) {
    }

    public record TransactionResponse(
            String entryId,
            String kind,
            PostingDirection direction,
            long amountMinor,
            String referenceId,
            Instant createdAt
    ) {
    }
}
