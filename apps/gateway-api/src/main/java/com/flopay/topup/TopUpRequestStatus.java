package com.flopay.topup;

public enum TopUpRequestStatus {
    PENDING,
    /** Approved by an admin — see TopUpRequest.settledEntryId for the credit. */
    APPROVED,
    REJECTED
}
