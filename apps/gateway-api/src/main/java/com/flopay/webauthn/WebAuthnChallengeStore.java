package com.flopay.webauthn;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Holds the in-flight registration/assertion request between "start" and
 * "finish" — these must round-trip byte-for-byte (they carry the server's
 * random challenge), so they're kept server-side rather than trusted back
 * from the client. In-memory only, same single-instance assumption as
 * {@link com.flopay.security.RateLimitFilter}: a lost entry (a restart mid-
 * ceremony) just means the user retries, never a security or correctness
 * issue since {@code RelyingParty} itself rejects a stale/reused challenge.
 */
@Component
class WebAuthnChallengeStore {

    private record Entry(String json, Instant expiresAt) {
    }

    private static final long TTL_SECONDS = 300;

    private final Map<String, Entry> registrations = new ConcurrentHashMap<>();
    private final Map<String, Entry> assertions = new ConcurrentHashMap<>();

    void putRegistration(Long userId, String optionsJson) {
        registrations.put(userId.toString(), new Entry(optionsJson, Instant.now().plusSeconds(TTL_SECONDS)));
    }

    String takeRegistration(Long userId) {
        return take(registrations, userId.toString());
    }

    void putAssertion(String phone, String requestJson) {
        assertions.put(phone, new Entry(requestJson, Instant.now().plusSeconds(TTL_SECONDS)));
    }

    String takeAssertion(String phone) {
        return take(assertions, phone);
    }

    private String take(Map<String, Entry> store, String key) {
        Entry entry = store.remove(key);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            return null;
        }
        return entry.json();
    }
}
