package com.flopay.webauthn;

import com.fasterxml.jackson.databind.JsonNode;
import com.flopay.consumer.dto.ConsumerAuthDtos.AuthResponse;
import com.flopay.security.SecurityUtils;
import com.flopay.webauthn.dto.WebAuthnDtos.LoginFinishRequest;
import com.flopay.webauthn.dto.WebAuthnDtos.LoginStartRequest;
import com.flopay.webauthn.dto.WebAuthnDtos.WebAuthnStatusResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet/webauthn")
@RequiredArgsConstructor
public class WebAuthnController {

    private final WebAuthnService webAuthnService;

    @GetMapping("/status")
    public WebAuthnStatusResponse status() {
        return webAuthnService.status(SecurityUtils.currentUserId());
    }

    @DeleteMapping("/credential")
    public void remove() {
        webAuthnService.remove(SecurityUtils.currentUserId());
    }

    /** Authenticated — adds a passkey to the already-logged-in user. */
    @PostMapping("/register/start")
    public JsonNode registerStart() {
        return webAuthnService.startRegistration(SecurityUtils.currentUserId());
    }

    @PostMapping("/register/finish")
    public void registerFinish(@RequestBody JsonNode credential) {
        webAuthnService.finishRegistration(SecurityUtils.currentUserId(), credential);
    }

    /** Public — there is no session yet; this IS the login. */
    @PostMapping("/login/start")
    public JsonNode loginStart(@Valid @RequestBody LoginStartRequest request) {
        return webAuthnService.startLogin(request.phone());
    }

    @PostMapping("/login/finish")
    public AuthResponse loginFinish(@Valid @RequestBody LoginFinishRequest request) {
        return webAuthnService.finishLogin(request.phone(), request.credential());
    }
}
