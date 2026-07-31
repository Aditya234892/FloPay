package com.flopay.ledger;

public enum AccountOwnerType {
    USER,
    MERCHANT,
    /** Owns no real owner_id — see {@link Account#SYSTEM_OWNER_ID}. */
    SYSTEM
}
