package com.flopay.consumer;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class VpaService {

    private static final String DOMAIN = "@flopay";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;

    /**
     * Derives a readable handle from the phone's last 6 digits, falling back to
     * a random numeric suffix on collision — two different phone numbers can
     * share a last-6-digits suffix, so collision is expected, not exceptional.
     */
    public String generateVpa(String phone) {
        String base = phone.length() >= 6 ? phone.substring(phone.length() - 6) : phone;
        String candidate = base + DOMAIN;

        while (userRepository.existsByVpa(candidate)) {
            candidate = base + RANDOM.nextInt(1000) + DOMAIN;
        }
        return candidate;
    }
}
