package com.flopay.consumer;

import com.flopay.consumer.dto.ConsumerAuthDtos.AuthResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpRequestRequest;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpRequestResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpVerifyRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
}
