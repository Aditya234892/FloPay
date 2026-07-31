package com.flopay.admin.dto;

import java.time.Instant;

public class AdminMerchantDtos {

    private AdminMerchantDtos() {
    }

    public record AdminMerchantResponse(
            Long id,
            String name,
            String email,
            String role,
            int activeApiKeyCount,
            Instant createdAt
    ) {
    }
}
