package com.flopay.rewards;

public enum ReferralStatus {
    /** Redeemed at signup, but the referee hasn't sent their first transfer yet — no bonus paid. */
    PENDING,
    /** The referee's first transfer settled; both sides have been paid their bonus. */
    REWARDED
}
