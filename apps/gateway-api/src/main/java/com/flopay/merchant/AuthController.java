package com.flopay.merchant;

import com.flopay.merchant.dto.MerchantDtos.AuthResponse;
import com.flopay.merchant.dto.MerchantDtos.LoginRequest;
import com.flopay.merchant.dto.MerchantDtos.SignupRequest;
import com.flopay.security.dto.RefreshTokenDtos.LogoutRequest;
import com.flopay.security.dto.RefreshTokenDtos.RefreshRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final MerchantService merchantService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(merchantService.signup(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return merchantService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return merchantService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody LogoutRequest request) {
        merchantService.logout(request.refreshToken());
    }
}
