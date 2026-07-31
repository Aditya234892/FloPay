package com.flopay.request;

public enum PaymentRequestStatus {
    PENDING,
    /** Settled — see PaymentRequest.settledEntryId for the ledger entry that moved the money. */
    PAID,
    /** The payer refused. */
    DECLINED,
    /** The requester withdrew it. */
    CANCELLED
}
