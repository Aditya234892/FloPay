package com.flopay.paymentlink;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A shareable "pay me" link. {@code amountMinor} is null for an open-amount
 * link (the payer decides how much to send, e.g. a tip jar or donation link)
 * — everything else about how money actually moves is delegated to
 * {@link com.flopay.transfer.TransferService}, this entity is just the
 * durable intent plus a short public code.
 */
@Entity
@Table(name = "payment_link")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentLink {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 12)
    private String code;

    @Column(nullable = false)
    private Long creatorUserId;

    /** Null means the payer chooses the amount when paying. */
    private Long amountMinor;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentLinkStatus status;

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
