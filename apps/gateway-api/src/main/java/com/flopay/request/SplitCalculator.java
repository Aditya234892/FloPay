package com.flopay.request;

import com.flopay.common.ApiException;

import java.util.ArrayList;
import java.util.List;

/**
 * Divides a bill into equal shares that still sum to exactly the total.
 *
 * <p>Naive division loses money: ₹1000 split three ways is 100000/3 = 33333
 * minor units each, which sums to 99999 — one paisa short. Over a split bill
 * that is trivial; as a habit in a ledger-backed system it is exactly the kind
 * of rounding drift that makes balances stop reconciling. The remainder is
 * distributed one unit at a time across the first shares, so the parts always
 * add up and the largest discrepancy between any two payers is one paisa.
 */
public final class SplitCalculator {

    private SplitCalculator() {
    }

    public static List<Long> splitEvenly(long totalMinor, int ways) {
        if (ways <= 0) {
            throw ApiException.badRequest("A split needs at least one payer");
        }
        if (totalMinor < ways) {
            // Below this, someone's share would round to zero, and a zero-amount
            // request would be rejected by the ledger's amount > 0 check anyway.
            throw ApiException.badRequest("Amount is too small to split between that many people");
        }

        long base = totalMinor / ways;
        int remainder = (int) (totalMinor % ways);

        List<Long> shares = new ArrayList<>(ways);
        for (int i = 0; i < ways; i++) {
            shares.add(i < remainder ? base + 1 : base);
        }
        return shares;
    }
}
