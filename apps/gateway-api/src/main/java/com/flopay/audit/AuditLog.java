package com.flopay.audit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A record of a sensitive action, for accountability rather than debugging —
 * this deliberately does not try to log everything (that's what application
 * logs are for). It exists so "who approved this top-up" and "who logged
 * into this merchant account" have an answer that survives past the request.
 */
@Entity
@Table(name = "audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private UUID id;

    /** e.g. "MERCHANT", "ADMIN", "USER" — kept as a plain string since the actor space isn't a closed enum. */
    @Column(nullable = false, length = 20)
    private String actorType;

    private Long actorId;

    @Column(nullable = false, length = 60)
    private String action;

    private String details;

    private String ipAddress;

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
