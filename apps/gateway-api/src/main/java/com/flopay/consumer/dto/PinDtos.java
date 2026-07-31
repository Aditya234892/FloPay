package com.flopay.consumer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PinDtos {

    private PinDtos() {
    }

    public record SetPinRequest(
            @NotBlank @Pattern(regexp = "\\d{6}", message = "must be exactly 6 digits") String pin
    ) {
    }

    public record VerifyPinRequest(
            @NotBlank @Pattern(regexp = "\\d{6}") String pin
    ) {
    }

    public record PinStatusResponse(boolean hasPinSet) {
    }

    public record VerifyPinResponse(boolean valid) {
    }
}
