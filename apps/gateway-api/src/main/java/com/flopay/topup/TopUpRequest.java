package com.flopay.topup;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A user's ask to have sandbox money credited to their wallet — purely an
 * intent, same as {@link com.flopay.request.PaymentRequest}. Approving it is
 * what actually moves money (via WalletService/LedgerService); this row is
 * only ever a record of who asked, who decided, and when.
 */
@Entity
@Table(name = "top_up_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopUpRequest {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long amountMinor;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TopUpRequestStatus status;

    /** The admin merchant who approved or rejected this; null while PENDING. */
    private Long decidedByMerchantId;

    private Instant decidedAt;

    /** The journal entry that credited the wallet; null until APPROVED. */
    private UUID settledEntryId;

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
