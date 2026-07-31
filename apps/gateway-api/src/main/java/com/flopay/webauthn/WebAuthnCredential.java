package com.flopay.webauthn;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A registered passkey/authenticator, stored the way {@link com.yubico.webauthn.RegisteredCredential}
 * needs it back: credential id and public key as Base64Url text (matches
 * {@code ByteArray.getBase64Url()}/{@code fromBase64Url()} directly, no extra
 * binary-encoding concerns across JDBC drivers).
 */
@Entity
@Table(name = "webauthn_credential")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebAuthnCredential {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true, length = 512)
    private String credentialIdBase64;

    @Column(nullable = false, length = 1024)
    private String publicKeyCoseBase64;

    @Builder.Default
    @Column(nullable = false)
    private long signatureCount = 0L;

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
