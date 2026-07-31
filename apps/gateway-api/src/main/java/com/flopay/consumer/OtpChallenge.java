package com.flopay.consumer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A one-time login code for a phone number. Hashed at rest with the same
 * BCrypt encoder used for merchant passwords and API key secrets — the code
 * is deliberately returned to the caller in the sandbox API response (there
 * is no SMS provider wired up), so hashing here doesn't hide the value from
 * anyone who can already see it, but nothing in this app stores a credential
 * in plaintext, sandbox or not.
 */
@Entity
@Table(name = "otp_challenges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String otpHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean consumed = false;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
