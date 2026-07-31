package com.flopay.webauthn.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class WebAuthnDtos {

    private WebAuthnDtos() {
    }

    public record WebAuthnStatusResponse(boolean enabled) {
    }

    public record LoginStartRequest(
            @NotBlank @Pattern(regexp = "\\d{10}") String phone
    ) {
    }

    public record LoginFinishRequest(
            @NotBlank @Pattern(regexp = "\\d{10}") String phone,
            @NotNull JsonNode credential
    ) {
    }
}
