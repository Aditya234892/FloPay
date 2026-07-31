package com.flopay.merchantpay.settlement;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** The settlement clock — batches every merchant's pending balance to settled on a fixed interval. */
@Component
@RequiredArgsConstructor
public class SettlementRunner {

    private final SettlementService settlementService;

    @Scheduled(fixedDelay = 5 * 60_000, initialDelay = 45_000)
    public void tick() {
        settlementService.runSettlementBatch(Instant.now());
    }
}
