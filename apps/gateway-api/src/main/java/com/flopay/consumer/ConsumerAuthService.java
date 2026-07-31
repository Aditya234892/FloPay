package com.flopay.consumer;

import com.flopay.common.ApiException;
import com.flopay.consumer.dto.ConsumerAuthDtos.AuthResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.CompleteProfileRequest;
import com.flopay.consumer.dto.ConsumerAuthDtos.OtpRequestResponse;
import com.flopay.consumer.dto.ConsumerAuthDtos.VpaSuggestion;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
import com.flopay.rewards.ReferralService;
import com.flopay.security.JwtService;
import com.flopay.security.PrincipalType;
import com.flopay.security.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsumerAuthService {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final VpaService vpaService;
    private final LedgerService ledgerService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final ReferralService referralService;

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
                    .referralCode(referralService.generateCode())
                    .profileComplete(false)
                    .build());
            ledgerService.openAccount(AccountOwnerType.USER, created.getId(), AccountKind.WALLET, "INR");
            return created;
        });

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public List<VpaSuggestion> suggestVpas(Long userId, String displayName) {
        User user = requireUser(userId);
        return vpaService.suggest(user.getPhone(), displayName, user.getVpa());
    }

    public boolean vpaAvailable(String vpa) {
        return vpaService.isAvailable(vpa);
    }

    /**
     * The one-time "choose your FloPay ID" step — replaces the placeholder
     * phone-digit VPA minted at first login with the user's own pick, and
     * captures the display name that was never collected during OTP auth.
     */
    @Transactional
    public AuthResponse completeProfile(Long userId, CompleteProfileRequest request) {
        User user = requireUser(userId);
        if (user.isProfileComplete()) {
            throw ApiException.conflict("Profile is already set up");
        }
        String vpa = request.vpa().toLowerCase();
        if (!vpa.equals(user.getVpa()) && !vpaService.isAvailable(vpa)) {
            throw ApiException.conflict("That FloPay ID is already taken");
        }

        user.setDisplayName(request.displayName().trim());
        user.setVpa(vpa);
        user.setProfileComplete(true);
        user = userRepository.save(user);

        if (request.referralCode() != null && !request.referralCode().isBlank()) {
            referralService.redeem(user.getId(), request.referralCode());
        }

        return toAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        RefreshTokenService.Rotated rotated = refreshTokenService.rotate(refreshToken, PrincipalType.USER);
        User user = requireUser(rotated.principalId());
        String accessToken = jwtService.generateUserToken(user.getId(), user.getPhone());
        return new AuthResponse(
                accessToken, rotated.rawToken(), user.getId(), user.getPhone(), user.getVpa(),
                user.getDisplayName(), user.isProfileComplete());
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateUserToken(user.getId(), user.getPhone());
        String refreshToken = refreshTokenService.issue(PrincipalType.USER, user.getId());
        return new AuthResponse(
                token, refreshToken, user.getId(), user.getPhone(), user.getVpa(), user.getDisplayName(),
                user.isProfileComplete());
    }
}
