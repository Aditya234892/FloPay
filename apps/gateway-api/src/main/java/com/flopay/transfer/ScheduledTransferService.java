package com.flopay.transfer;

import com.flopay.common.ApiException;
import com.flopay.transfer.dto.ScheduledTransferDtos.CreateScheduledTransferRequest;
import com.flopay.transfer.dto.ScheduledTransferDtos.ScheduledTransferResponse;
import com.flopay.transfer.dto.TransferDtos.TransferRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScheduledTransferService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTransferService.class);

    private final ScheduledTransferRepository scheduledTransferRepository;
    private final TransferService transferService;

    @Transactional
    public ScheduledTransferResponse create(Long userId, CreateScheduledTransferRequest request) {
        ScheduledTransfer saved = scheduledTransferRepository.save(ScheduledTransfer.builder()
                .userId(userId)
                .toVpa(request.toVpa().trim().toLowerCase())
                .amountMinor(request.amountMinor())
                .note(request.note())
                .frequency(request.frequency())
                .nextRunAt(request.firstRunAt())
                .build());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ScheduledTransferResponse> listForUser(Long userId) {
        return scheduledTransferRepository.findByUserIdAndActiveTrueOrderByNextRunAtAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void cancel(Long userId, UUID id) {
        ScheduledTransfer scheduled = scheduledTransferRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Scheduled transfer not found"));
        if (!scheduled.getUserId().equals(userId)) {
            throw ApiException.notFound("Scheduled transfer not found");
        }
        scheduled.setActive(false);
        scheduledTransferRepository.save(scheduled);
    }

    /**
     * Called on a fixed timer (see {@link ScheduledTransferRunner}). Each due
     * transfer is executed and re-scheduled independently — one failing
     * (insufficient balance, a VPA that stopped existing) must not stop the
     * rest of the batch from running.
     */
    @Transactional
    public void runDue(Instant now) {
        for (ScheduledTransfer scheduled : scheduledTransferRepository.findByActiveTrueAndNextRunAtLessThanEqual(now)) {
            runOne(scheduled, now);
        }
    }

    private void runOne(ScheduledTransfer scheduled, Instant now) {
        String idempotencyKey = "scheduled:" + scheduled.getId() + ":" + scheduled.getNextRunAt();
        try {
            transferService.transfer(scheduled.getUserId(), new TransferRequest(
                    scheduled.getToVpa(), scheduled.getAmountMinor(), scheduled.getNote(), idempotencyKey));
            scheduled.setLastError(null);
        } catch (Exception e) {
            // Left active — a failed run (e.g. insufficient balance today)
            // shouldn't cancel a recurring transfer outright; it just skips
            // this occurrence and tries again next cycle.
            scheduled.setLastError(e.getMessage());
            log.warn("Scheduled transfer {} failed: {}", scheduled.getId(), e.getMessage());
        }

        scheduled.setLastRunAt(now);
        if (scheduled.getFrequency() == null) {
            scheduled.setActive(false);
        } else {
            scheduled.setNextRunAt(nextOccurrence(scheduled.getNextRunAt(), scheduled.getFrequency()));
        }
        scheduledTransferRepository.save(scheduled);
    }

    /** MONTHLY is a flat 30 days, not calendar-month-aware — close enough for a demo, drifts against real months over a year. */
    private Instant nextOccurrence(Instant from, ScheduleFrequency frequency) {
        return switch (frequency) {
            case DAILY -> from.plus(1, ChronoUnit.DAYS);
            case WEEKLY -> from.plus(7, ChronoUnit.DAYS);
            case MONTHLY -> from.plus(30, ChronoUnit.DAYS);
        };
    }

    private ScheduledTransferResponse toResponse(ScheduledTransfer s) {
        return new ScheduledTransferResponse(
                s.getId().toString(), s.getToVpa(), s.getAmountMinor(), s.getNote(), s.getFrequency(),
                s.getNextRunAt(), s.getLastRunAt(), s.isActive(), s.getLastError());
    }
}
