package com.flopay.request;

import com.flopay.common.ApiException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pure unit test — no Spring context, no database. The whole point of this
 * class is arithmetic that must never lose a paisa, and that is testable
 * without any infrastructure.
 */
class SplitCalculatorTest {

    @Test
    void evenSplitDividesExactly() {
        assertEquals(List.of(25_000L, 25_000L, 25_000L, 25_000L), SplitCalculator.splitEvenly(100_000, 4));
    }

    @Test
    void unevenSplitStillSumsToTheExactTotal() {
        // 100000 / 3 = 33333.33 — naive division would sum to 99999 and quietly
        // lose a paisa. The remainder must land on someone.
        List<Long> shares = SplitCalculator.splitEvenly(100_000, 3);

        assertEquals(100_000L, shares.stream().mapToLong(Long::longValue).sum());
        assertEquals(List.of(33_334L, 33_333L, 33_333L), shares);
    }

    @Test
    void noTwoSharesDifferByMoreThanOneUnit() {
        for (int ways = 2; ways <= 17; ways++) {
            List<Long> shares = SplitCalculator.splitEvenly(100_001, ways);
            long max = shares.stream().mapToLong(Long::longValue).max().orElseThrow();
            long min = shares.stream().mapToLong(Long::longValue).min().orElseThrow();

            assertTrue(max - min <= 1, "ways=" + ways + " produced an unfair spread: " + shares);
            assertEquals(100_001L, shares.stream().mapToLong(Long::longValue).sum(), "ways=" + ways);
        }
    }

    @Test
    void rejectsSplitsThatWouldGiveSomeoneZero() {
        // 2 paise between 3 people cannot work — a zero-amount request would be
        // rejected by the ledger anyway, so fail early with a clear message.
        assertThrows(ApiException.class, () -> SplitCalculator.splitEvenly(2, 3));
    }

    @Test
    void rejectsNonPositiveWays() {
        assertThrows(ApiException.class, () -> SplitCalculator.splitEvenly(1_000, 0));
    }
}
