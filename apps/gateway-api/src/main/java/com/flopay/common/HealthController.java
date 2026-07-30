package com.flopay.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Unauthenticated liveness probe for the platform's health check.
 *
 * Deliberately reports nothing but liveness and the active mode — build details,
 * database URLs or dependency status on a public endpoint are reconnaissance for
 * anyone scanning the host.
 */
@RestController
public class HealthController {

    private final String activeProfile;

    public HealthController(@Value("${spring.profiles.active:default}") String activeProfile) {
        this.activeProfile = activeProfile;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "mode", activeProfile);
    }
}
