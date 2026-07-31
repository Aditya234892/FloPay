package com.flopay.consumer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ConsumerAuthDtos {

    private ConsumerAuthDtos() {
    }

    public record OtpRequestRequest(
            @NotBlank @Pattern(regexp = "\\d{10}", message = "must be a 10-digit phone number") String phone
    ) {
    }

    /**
     * sandboxOtp exists only because no SMS provider is wired up — a real
     * deployment would send this by SMS and never put it in an API response.
     * The field name says so explicitly rather than a plain "otp" that would
     * read as normal production behaviour.
     */
    public record OtpRequestResponse(String phone, String sandboxOtp, int expiresInSeconds) {
    }

    public record OtpVerifyRequest(
            @NotBlank @Pattern(regexp = "\\d{10}") String phone,
            @NotBlank @Pattern(regexp = "\\d{6}") String otp
    ) {
    }

    public record AuthResponse(
            String token, String refreshToken, Long userId, String phone, String vpa, String displayName,
            boolean profileComplete
    ) {
    }

    public record VpaSuggestion(String vpa, boolean available) {
    }

    public record VpaAvailabilityResponse(boolean available) {
    }

    public record CompleteProfileRequest(
            @NotBlank @Pattern(regexp = ".{1,60}", message = "must be 1-60 characters") String displayName,
            @NotBlank @Pattern(
                    regexp = "[a-z0-9][a-z0-9.]{2,29}@flopay",
                    message = "must be 3-30 lowercase letters, digits or dots, followed by @flopay"
            ) String vpa,
            /** Optional — redeemed once, at this same step, if present. */
            String referralCode
    ) {
    }
}
