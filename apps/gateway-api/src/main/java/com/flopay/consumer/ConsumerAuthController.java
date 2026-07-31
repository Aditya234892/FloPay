package com.flopay.consumer;

import com.flopay.consumer.dto.ConsumerAuthDtos.AuthResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.CompleteProfileRequest;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpRequestRequest;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpRequestResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpVerifyRequest;
import com.flopay.consumer.dto.ConsumerAuthDtos.VpaAvailabilityResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.VpaSuggestion;
import com.flopay.security.SecurityUtils;
import com.flopay.security.dto.RefreshTokenDtos.LogoutRequest;
import com.flopay.security.dto.RefreshTokenDtos.RefreshRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet/auth")
@RequiredArgsConstructor
public class ConsumerAuthController {

    private final ConsumerAuthService consumerAuthService;

    @PostMapping("/otp/request")
    public OtpRequestResponse requestOtp(@Valid @RequestBody OtpRequestRequest request) {
        return consumerAuthService.requestOtp(request.phone());
    }

    @PostMapping("/otp/verify")
    public AuthResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return consumerAuthService.verifyOtp(request.phone(), request.otp());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return consumerAuthService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody LogoutRequest request) {
        consumerAuthService.logout(request.refreshToken());
    }

    /** Called from the "choose your FloPay ID" step, after login but before profile setup. */
    @GetMapping("/vpa-suggestions")
    public List<VpaSuggestion> vpaSuggestions(@RequestParam(required = false) String displayName) {
        return consumerAuthService.suggestVpas(SecurityUtils.currentUserId(), displayName);
    }

    /** Live availability check while the user types a custom handle. */
    @GetMapping("/vpa-availability")
    public VpaAvailabilityResponse vpaAvailability(@RequestParam String vpa) {
        return new VpaAvailabilityResponse(consumerAuthService.vpaAvailable(vpa.toLowerCase()));
    }

    @PostMapping("/complete-profile")
    public AuthResponse completeProfile(@Valid @RequestBody CompleteProfileRequest request) {
        return consumerAuthService.completeProfile(SecurityUtils.currentUserId(), request);
    }
}
