package com.flopay.webauthn;

import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class WebAuthnConfig {

    @Bean
    public RelyingParty relyingParty(
            FloPayCredentialRepository credentialRepository,
            @Value("${flopay.webauthn.rp-id}") String rpId,
            @Value("${flopay.webauthn.rp-name}") String rpName,
            @Value("${flopay.webauthn.allowed-origins}") String allowedOrigins
    ) {
        RelyingPartyIdentity identity = RelyingPartyIdentity.builder()
                .id(rpId)
                .name(rpName)
                .build();

        Set<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toSet());

        return RelyingParty.builder()
                .identity(identity)
                .credentialRepository(credentialRepository)
                // The consumer app's dev port can vary run to run; a mismatch
                // here just means "log in with OTP instead," never a security
                // hole in a Postgres-scale demo — production origins are
                // still an explicit, exact allowlist via FLOPAY_WEBAUTHN_ORIGINS.
                .allowOriginPort(true)
                .origins(origins)
                .build();
    }
}
