package com.flopay.rewards;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * One "X was invited by Y" relationship, redeemed once at the referee's
 * profile-completion step. The bonus is deliberately not paid here — it's
 * paid the first time the referee actually sends money (see
 * {@link ReferralService#maybeRewardOnFirstTransfer}), so a code redeemed
 * but never used doesn't mint free money.
 */
@Entity
@Table(name = "referral")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Referral {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Long referrerUserId;

    @Column(nullable = false, unique = true)
    private Long refereeUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReferralStatus status;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant rewardedAt;

    @PrePersist
    void assignId() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
