package com.flopay.merchant.dto;

import java.time.Instant;

public class ApiKeyDtos {

    private ApiKeyDtos() {
    }

    /** key_secret is populated ONLY on creation and never persisted or shown again. */
    public record ApiKeyCreatedResponse(
            String keyId,
            String keySecret,
            boolean active,
            Instant createdAt
    ) {
    }

    public record ApiKeySummaryResponse(
            String keyId,
            boolean active,
            Instant createdAt
    ) {
    }
}
