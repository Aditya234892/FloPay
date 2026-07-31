package com.flopay.consumer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A wallet-app consumer, identified by phone number rather than email/password. */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String phone;

    /** e.g. "raj9821@flopay" — how other users send this person money. */
    @Column(nullable = false, unique = true)
    private String vpa;

    private String displayName;

    /**
     * False right after first OTP verify — the account exists (with a
     * placeholder phone-digit VPA) so it can receive money immediately, but
     * the consumer app forces a "choose your FloPay ID" step before Home
     * until this flips true. Existing rows backfill true (see migration).
     */
    @Builder.Default
    @Column(nullable = false)
    private boolean profileComplete = false;

    /** BCrypt hash of a 6-digit app-lock PIN. Null means no PIN is configured — the app lock is opt-in. */
    private String pinHash;

    /** Admin-only kill switch — a frozen wallet can still receive money but can't send it. */
    @Builder.Default
    @Column(nullable = false)
    private boolean frozen = false;

    /** Assigned at signup, alongside the placeholder VPA — shared to earn a referral bonus. */
    @Column(nullable = false, unique = true, length = 16)
    private String referralCode;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
