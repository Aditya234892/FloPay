package com.flopay.ledger;

/** One row of {@link PostingRepository#findOutboundVelocity} — a user's outbound P2P activity in a time window. */
public record PostingVelocity(Long userId, Long transferCount, Long totalMinor) {
}
