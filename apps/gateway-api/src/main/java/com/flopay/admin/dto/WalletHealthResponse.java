package com.flopay.admin.dto;

public record WalletHealthResponse(
        long totalWalletMinor,
        long totalSettlementPendingMinor,
        long totalSettledMinor,
        long totalIssuanceMinor,
        long totalFeesMinor,
        long totalRewardsMinor,
        /** Every account kind's balances summed together — must be exactly zero for a balanced double-entry ledger. */
        long netMinor,
        boolean reconciles,
        long userCount,
        long frozenUserCount
) {
}
