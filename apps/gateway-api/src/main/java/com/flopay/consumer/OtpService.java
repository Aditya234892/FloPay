package com.flopay.consumer;

import com.flopay.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Duration EXPIRY = Duration.ofMinutes(5);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository otpChallengeRepository;
    private final PasswordEncoder passwordEncoder;

    public record IssuedOtp(String code, int expiresInSeconds) {
    }

    @Transactional
    public IssuedOtp requestOtp(String phone) {
        // Only the most recently issued code should ever be valid — otherwise
        // an old code, already displayed once on a previous screen, would
        // still work.
        otpChallengeRepository.invalidateOutstanding(phone);

        String code = "%06d".formatted(RANDOM.nextInt(1_000_000));
        otpChallengeRepository.save(OtpChallenge.builder()
                .phone(phone)
                .otpHash(passwordEncoder.encode(code))
                .expiresAt(Instant.now().plus(EXPIRY))
                .build());

        return new IssuedOtp(code, (int) EXPIRY.toSeconds());
    }

    /** @throws ApiException (400) if there is no matching, unexpired, unconsumed code. */
    @Transactional
    public void verifyOtp(String phone, String code) {
        OtpChallenge challenge = otpChallengeRepository
                .findFirstByPhoneAndConsumedFalseOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> ApiException.badRequest("No OTP requested for this number, or it already expired"));

        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("OTP has expired — request a new one");
        }
        if (!passwordEncoder.matches(code, challenge.getOtpHash())) {
            throw ApiException.badRequest("Incorrect OTP");
        }

        challenge.setConsumed(true);
        otpChallengeRepository.save(challenge);
    }
}
