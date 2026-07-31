package com.flopay.security;

import com.flopay.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

/**
 * Issues and rotates long-lived refresh tokens so a session can outlive the
 * short-lived access token ({@link JwtService}) without asking the user to
 * log in again — and so a single session can be revoked (logout, "sign out
 * everywhere") independently of every other session on the same account.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${flopay.jwt.refresh-expiry-days:30}")
    private long refreshExpiryDays;

    @Transactional
    public String issue(PrincipalType principalType, Long principalId) {
        String raw = generateRawToken();
        refreshTokenRepository.save(RefreshToken.builder()
                .principalType(principalType)
                .principalId(principalId)
                .tokenHash(hash(raw))
                .expiresAt(Instant.now().plus(refreshExpiryDays, ChronoUnit.DAYS))
                .build());
        return raw;
    }

    /**
     * Validates the presented token, revokes it, and issues a replacement —
     * rotation on every use so a stolen-but-unused token has a single-use
     * window rather than remaining valid for its whole 30-day lifetime.
     */
    @Transactional
    public Rotated rotate(String rawToken, PrincipalType expectedType) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> ApiException.unauthorized("Invalid or expired refresh token"));

        if (token.getPrincipalType() != expectedType || !token.isUsable(Instant.now())) {
            throw ApiException.unauthorized("Invalid or expired refresh token");
        }

        token.setRevokedAt(Instant.now());
        refreshTokenRepository.save(token);

        String next = issue(token.getPrincipalType(), token.getPrincipalId());
        return new Rotated(token.getPrincipalId(), next);
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available on the JVM", e);
        }
    }

    public record Rotated(Long principalId, String rawToken) {
    }
}
