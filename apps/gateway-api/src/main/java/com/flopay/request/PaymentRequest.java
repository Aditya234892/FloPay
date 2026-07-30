package com.flopay.request;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * One user asking another for money. Purely an intent — approving it is what
 * moves money, via {@link com.flopay.transfer.TransferService}, and the ledger
 * remains the only source of truth for balances.
 *
 * <p>User references are stored as raw ids rather than {@code @ManyToOne}
 * associations: this entity is read in list endpoints that would otherwise
 * trigger a proxy load per row, and the callers already need to resolve both
 * users' VPAs anyway.
 */
@Entity
@Table(name = "payment_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Long requesterUserId;

    @Column(nullable = false)
    private Long payerUserId;

    @Column(nullable = false)
    private Long amountMinor;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentRequestStatus status;

    /** Non-null when this request is one share of a split bill. */
    private UUID splitGroupId;

    /** The journal entry that settled this; null until {@link PaymentRequestStatus#PAID}. */
    private UUID settledEntryId;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    void assignId() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
