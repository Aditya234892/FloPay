package com.flopay.ledger;

public enum AccountKind {
    /** A user's or merchant's spendable balance. Must never go negative. */
    WALLET,
    /** Funds captured by a merchant but still inside the settlement hold. */
    SETTLEMENT_PENDING,
    /** Funds past the settlement hold, available to the merchant. */
    SETTLED,
    /**
     * The one account allowed to run negative. Every rupee credited anywhere
     * in the ledger is debited from here first, so its balance is always
     * {@code -(total value ever minted)} — the system's record of what it
     * owes the sum of every other account.
     */
    ISSUANCE,
    /** Platform revenue collected from transaction fees. */
    FEES
}
