package com.flopay.merchantpay;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A record of a wallet-to-merchant payment, alongside the ledger entry that
 * actually moved the money — same pattern as {@code PaymentRequest} and
 * {@code TopUpRequest}: the ledger is the source of truth for balances, this
 * is what lets the merchant dashboard list "who paid me" without joining
 * through raw postings.
 */
@Entity
@Table(name = "merchant_wallet_payment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MerchantWalletPayment {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Long merchantId;

    @Column(nullable = false)
    private Long payerUserId;

    /** Snapshotted at payment time — a payer changing their VPA/name later shouldn't rewrite merchant history. */
    @Column(nullable = false)
    private String payerVpaSnapshot;

    private String payerDisplayNameSnapshot;

    @Column(nullable = false)
    private Long amountMinor;

    private String note;

    @Column(nullable = false)
    private UUID entryId;

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
