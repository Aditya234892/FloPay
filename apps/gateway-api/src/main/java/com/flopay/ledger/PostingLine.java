package com.flopay.ledger;

import com.flopay.common.ApiException;

/** One leg of a journal entry, as requested by a caller of {@link LedgerService#post}. */
public record PostingLine(Long accountId, PostingDirection direction, long amountMinor) {

    public PostingLine {
        if (accountId == null) {
            throw ApiException.badRequest("Posting line is missing an account id");
        }
        if (amountMinor <= 0) {
            throw ApiException.badRequest("Posting amount must be greater than zero");
        }
    }

    public static PostingLine debit(Long accountId, long amountMinor) {
        return new PostingLine(accountId, PostingDirection.DEBIT, amountMinor);
    }

    public static PostingLine credit(Long accountId, long amountMinor) {
        return new PostingLine(accountId, PostingDirection.CREDIT, amountMinor);
    }
}
