package com.flopay.transfer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** A recurring or future-dated transfer the user set up in advance — the scheduler job is what actually moves the money. */
@Entity
@Table(name = "scheduled_transfer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledTransfer {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String toVpa;

    @Column(nullable = false)
    private Long amountMinor;

    private String note;

    /** Null means one-time — runs once at nextRunAt, then deactivates itself. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ScheduleFrequency frequency;

    @Column(nullable = false)
    private Instant nextRunAt;

    private Instant lastRunAt;

    /** Set to false after a one-time run, or if the user cancels a recurring one. */
    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    /** Records why the most recent run failed (e.g. insufficient balance) — null if it never has. */
    private String lastError;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void assignId() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
