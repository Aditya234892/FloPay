package com.flopay.admin.dto;

import java.time.Instant;

public class AdminUserDtos {

    private AdminUserDtos() {
    }

    public record AdminUserResponse(
            Long id,
            String phone,
            String vpa,
            String displayName,
            boolean profileComplete,
            boolean frozen,
            long walletBalanceMinor,
            Instant createdAt
    ) {
    }
}
