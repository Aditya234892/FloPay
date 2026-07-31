package com.flopay.transfer;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** The actual clock — polls for due scheduled transfers and hands them to {@link ScheduledTransferService#runDue}. */
@Component
@RequiredArgsConstructor
public class ScheduledTransferRunner {

    private final ScheduledTransferService scheduledTransferService;

    @Scheduled(fixedDelay = 60_000, initialDelay = 15_000)
    public void tick() {
        scheduledTransferService.runDue(Instant.now());
    }
}
