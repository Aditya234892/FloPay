package com.flopay.security.dto;

import jakarta.validation.constraints.NotBlank;

/** Shared by both merchant (/api/auth) and consumer (/api/wallet/auth) controllers. */
public class RefreshTokenDtos {

    private RefreshTokenDtos() {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record LogoutRequest(@NotBlank String refreshToken) {
    }
}
