package com.flopay.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    /**
     * The value baked into application.yml. It lives in a public repository, so a
     * token signed with it is forgeable by anyone who can read the source.
     */
    static final String DEV_DEFAULT_SECRET = "dev-only-insecure-jwt-secret-never-deploy-this-32bytes+";

    /** HMAC-SHA256 needs at least 256 bits of key material. */
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final long expiryMillis;

    public JwtService(
            @Value("${flopay.jwt.secret}") String secret,
            @Value("${flopay.jwt.expiry-minutes:120}") long expiryMinutes,
            Environment environment
    ) {
        validate(secret, environment);
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiryMillis = expiryMinutes * 60 * 1000;
    }

    /**
     * Refuses to boot a deployment that would sign tokens with the public dev
     * secret. Failing at startup is the point: a running service on a known key
     * silently accepts forged sessions for every merchant, and nothing downstream
     * would ever surface that.
     */
    private static void validate(String secret, Environment environment) {
        boolean devProfile = environment.matchesProfiles("dev");

        if (DEV_DEFAULT_SECRET.equals(secret) && !devProfile) {
            throw new IllegalStateException(
                    "flopay.jwt.secret is still the built-in development value, which is committed "
                            + "to a public repository and therefore public knowledge. Set the "
                            + "FLOPAY_JWT_SECRET environment variable to a private random string of at "
                            + "least " + MIN_SECRET_BYTES + " bytes before serving traffic."
            );
        }

        if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "flopay.jwt.secret must be at least " + MIN_SECRET_BYTES
                            + " bytes for HMAC-SHA256; got " + secret.getBytes(StandardCharsets.UTF_8).length + "."
            );
        }
    }

    public String generateMerchantToken(Long merchantId, String email) {
        return buildToken(merchantId, PrincipalType.MERCHANT, "email", email);
    }

    public String generateUserToken(Long userId, String phone) {
        return buildToken(userId, PrincipalType.USER, "phone", phone);
    }

    private String buildToken(Long id, PrincipalType type, String extraClaimName, String extraClaimValue) {
        Date now = new Date();
        return Jwts.builder()
                .subject(id.toString())
                .claim("type", type.name())
                .claim(extraClaimName, extraClaimValue)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMillis))
                .signWith(key)
                .compact();
    }

    /**
     * @throws io.jsonwebtoken.JwtException on a malformed, expired, or badly
     *         signed token; @throws IllegalArgumentException if a token was
     *         validly signed by this service but predates the "type" claim
     *         (should not happen outside local dev against old tokens).
     */
    public AuthenticatedPrincipal parsePrincipal(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String typeClaim = claims.get("type", String.class);
        if (typeClaim == null) {
            throw new IllegalArgumentException("Token has no principal type claim");
        }
        return new AuthenticatedPrincipal(Long.parseLong(claims.getSubject()), PrincipalType.valueOf(typeClaim));
    }
}
