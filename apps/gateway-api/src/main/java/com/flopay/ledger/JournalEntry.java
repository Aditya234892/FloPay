package com.flopay.ledger;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * One balanced movement of money — a top-up, a P2P transfer, a checkout
 * capture, a settlement run, a refund. Never written directly; always created
 * through {@link LedgerService#post}, which is what actually guarantees its
 * postings sum to zero before this row and its postings commit.
 *
 * <p>The id is assigned in application code ({@link #assignId()}), not left to
 * the database's {@code gen_random_uuid()} default — that default exists only
 * as a safety net for a hypothetical direct SQL insert, matching how every
 * other entity in this codebase (Order, Payment, Refund) already generates its
 * own id rather than trusting the database to.
 */
@Entity
@Table(name = "journal_entry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    private UUID id;

    /**
     * Supplied by the caller, not generated here. A retried request (a flaky
     * client, a redelivered webhook, a double-tapped button) must pass the
     * same key so the unique constraint on this column turns the retry into a
     * safe no-op instead of a second, duplicate transfer.
     */
    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    /** Free-text tag for reporting — TOPUP, P2P_TRANSFER, CHECKOUT_PAYMENT, ... */
    @Column(nullable = false, length = 40)
    private String kind;

    /** Loosely-typed pointer to whatever domain object drove this entry. */
    private String referenceId;

    /** Optional user-supplied message — "for rent", a birthday note, etc. */
    private String note;

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
