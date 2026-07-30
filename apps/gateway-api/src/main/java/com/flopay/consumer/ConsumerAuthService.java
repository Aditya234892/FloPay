package com.flopay.consumer;

import com.flopay.consumer.dto.ConsumerAuthDtos.AuthResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpRequestResponse;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
import com.flopay.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConsumerAuthService {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final VpaService vpaService;
    private final LedgerService ledgerService;
    private final JwtService jwtService;

    public OtpRequestResponse requestOtp(String phone) {
        var issued = otpService.requestOtp(phone);
        return new OtpRequestResponse(phone, issued.code(), issued.expiresInSeconds());
    }

    /**
     * Verifies the code and signs in, creating the account (and its wallet) on
     * first login rather than requiring a separate signup step — the
     * conventional pattern for phone-auth consumer apps.
     *
     * <p>Not race-safe against two simultaneous first-time verifications for
     * the same brand-new phone number (same narrow, documented limitation as
     * {@link LedgerService#openAccount}) — acceptable for a login path where
     * that would require the same OTP to be replayed concurrently, not
     * acceptable if this pattern were ever reused for a money-moving flow.
     */
    @Transactional
    public AuthResponse verifyOtp(String phone, String otp) {
        otpService.verifyOtp(phone, otp);

        User user = userRepository.findByPhone(phone).orElseGet(() -> {
            User created = userRepository.save(User.builder()
                    .phone(phone)
                    .vpa(vpaService.generateVpa(phone))
                    .build());
            ledgerService.openAccount(AccountOwnerType.USER, created.getId(), AccountKind.WALLET, "INR");
            return created;
        });

        String token = jwtService.generateUserToken(user.getId(), user.getPhone());
        return new AuthResponse(token, user.getId(), user.getPhone(), user.getVpa(), user.getDisplayName());
    }
}
