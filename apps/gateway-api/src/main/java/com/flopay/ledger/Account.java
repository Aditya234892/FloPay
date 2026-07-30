package com.flopay.ledger;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A balance-holding ledger account. {@link #balanceMinor} is a materialised
 * cache — the true balance is always {@code SUM(credits) - SUM(debits)} over
 * {@link Posting}, and this field is only ever mutated by {@link LedgerService}
 * in the same transaction as the postings that justify the change.
 *
 * <p>The database enforces {@code balance_minor >= 0} for every kind except
 * {@link AccountKind#ISSUANCE} (see V2__ledger.sql) — that is the real,
 * unbypassable guarantee against overdraft; this class does not re-implement
 * it, only exposes balances for the application to read and reason about.
 */
@Entity
@Table(name = "account")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    /**
     * SYSTEM accounts (ISSUANCE, FEES) have no real owning user or merchant.
     * This sentinel — rather than NULL — is what lets the database's
     * uq_account_owner_kind_currency constraint actually prevent a second
     * ISSUANCE account from being created per currency: SQL treats every NULL
     * as distinct from every other NULL for uniqueness purposes, so NULL would
     * silently defeat the constraint here.
     */
    public static final long SYSTEM_OWNER_ID = 0L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountOwnerType ownerType;

    @Column(nullable = false)
    private Long ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountKind kind;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Builder.Default
    @Column(nullable = false)
    private Long balanceMinor = 0L;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
