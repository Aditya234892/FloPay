package com.flopay.transfer.dto;

import com.flopay.transfer.ScheduleFrequency;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class ScheduledTransferDtos {

    private ScheduledTransferDtos() {
    }

    public record CreateScheduledTransferRequest(
            @NotBlank String toVpa,
            @Positive long amountMinor,
            @Size(max = 140) String note,
            /** Null means one-time, at firstRunAt. */
            ScheduleFrequency frequency,
            @NotNull @Future Instant firstRunAt
    ) {
    }

    public record ScheduledTransferResponse(
            String id,
            String toVpa,
            long amountMinor,
            String note,
            ScheduleFrequency frequency,
            Instant nextRunAt,
            Instant lastRunAt,
            boolean active,
            String lastError
    ) {
    }
}
