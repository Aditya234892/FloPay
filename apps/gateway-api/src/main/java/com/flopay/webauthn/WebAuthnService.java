package com.flopay.webauthn;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flopay.common.ApiException;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.consumer.dto.ConsumerAuthDtos.AuthResponse;
import com.flopay.security.JwtService;
import com.flopay.security.PrincipalType;
import com.flopay.security.RefreshTokenService;
import com.flopay.webauthn.dto.WebAuthnDtos.WebAuthnStatusResponse;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.AuthenticatorAssertionResponse;
import com.yubico.webauthn.data.AuthenticatorAttestationResponse;
import com.yubico.webauthn.data.ClientAssertionExtensionOutputs;
import com.yubico.webauthn.data.ClientRegistrationExtensionOutputs;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

/**
 * Passkey/biometric login for the consumer wallet app — a WebAuthn
 * credential registered after a normal OTP login, then usable in place of
 * OTP on future logins from the same device. Two independent ceremonies:
 * registration (adding a credential to an already-authenticated user) and
 * assertion (logging in with one, no session yet).
 */
@Service
@RequiredArgsConstructor
public class WebAuthnService {

    private final RelyingParty relyingParty;
    private final UserRepository userRepository;
    private final WebAuthnCredentialRepository webAuthnCredentialRepository;
    private final WebAuthnChallengeStore challengeStore;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public JsonNode startRegistration(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        UserIdentity identity = UserIdentity.builder()
                .name(user.getPhone())
                .displayName(user.getDisplayName() != null ? user.getDisplayName() : user.getPhone())
                .id(UserHandles.of(user.getId()))
                .build();

        PublicKeyCredentialCreationOptions options = relyingParty.startRegistration(
                StartRegistrationOptions.builder().user(identity).build());

        try {
            challengeStore.putRegistration(userId, options.toJson());
            return readTree(options.toCredentialsCreateJson());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize WebAuthn registration options", e);
        }
    }

    @Transactional
    public void finishRegistration(Long userId, JsonNode credential) {
        String optionsJson = challengeStore.takeRegistration(userId);
        if (optionsJson == null) {
            throw ApiException.badRequest("Registration session expired — try again");
        }

        try {
            PublicKeyCredentialCreationOptions options = PublicKeyCredentialCreationOptions.fromJson(optionsJson);
            PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> response =
                    PublicKeyCredential.parseRegistrationResponseJson(credential.toString());

            RegistrationResult result = relyingParty.finishRegistration(FinishRegistrationOptions.builder()
                    .request(options)
                    .response(response)
                    .build());

            webAuthnCredentialRepository.save(WebAuthnCredential.builder()
                    .userId(userId)
                    .credentialIdBase64(result.getKeyId().getId().getBase64Url())
                    .publicKeyCoseBase64(result.getPublicKeyCose().getBase64Url())
                    .signatureCount(result.getSignatureCount())
                    .build());
        } catch (IOException e) {
            throw ApiException.badRequest("Malformed credential response");
        } catch (RegistrationFailedException e) {
            throw ApiException.badRequest("Could not verify that passkey: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public JsonNode startLogin(String phone) {
        if (!userRepository.findByPhone(phone).map(u -> webAuthnCredentialRepository.existsByUserId(u.getId())).orElse(false)) {
            throw ApiException.badRequest("No passkey set up for this number — log in with OTP instead");
        }

        AssertionRequest request = relyingParty.startAssertion(StartAssertionOptions.builder().username(phone).build());
        try {
            challengeStore.putAssertion(phone, request.toJson());
            return readTree(request.toCredentialsGetJson());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize WebAuthn assertion request", e);
        }
    }

    @Transactional
    public AuthResponse finishLogin(String phone, JsonNode credential) {
        String requestJson = challengeStore.takeAssertion(phone);
        if (requestJson == null) {
            throw ApiException.badRequest("Login session expired — try again");
        }

        AssertionResult result;
        try {
            AssertionRequest request = AssertionRequest.fromJson(requestJson);
            PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> response =
                    PublicKeyCredential.parseAssertionResponseJson(credential.toString());

            result = relyingParty.finishAssertion(FinishAssertionOptions.builder()
                    .request(request)
                    .response(response)
                    .build());
        } catch (IOException e) {
            throw ApiException.badRequest("Malformed credential response");
        } catch (AssertionFailedException e) {
            throw ApiException.unauthorized("Passkey verification failed");
        }

        if (!result.isSuccess()) {
            throw ApiException.unauthorized("Passkey verification failed");
        }

        webAuthnCredentialRepository.findByCredentialIdBase64(result.getCredential().getCredentialId().getBase64Url())
                .ifPresent(c -> {
                    c.setSignatureCount(result.getSignatureCount());
                    webAuthnCredentialRepository.save(c);
                });

        User user = userRepository.findByPhone(result.getUsername())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        String token = jwtService.generateUserToken(user.getId(), user.getPhone());
        String refreshToken = refreshTokenService.issue(PrincipalType.USER, user.getId());
        return new AuthResponse(
                token, refreshToken, user.getId(), user.getPhone(), user.getVpa(), user.getDisplayName(),
                user.isProfileComplete());
    }

    @Transactional(readOnly = true)
    public WebAuthnStatusResponse status(Long userId) {
        return new WebAuthnStatusResponse(webAuthnCredentialRepository.existsByUserId(userId));
    }

    @Transactional
    public void remove(Long userId) {
        webAuthnCredentialRepository.deleteByUserId(userId);
    }

    private JsonNode readTree(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (IOException e) {
            throw new IllegalStateException("The WebAuthn library produced invalid JSON", e);
        }
    }
}
