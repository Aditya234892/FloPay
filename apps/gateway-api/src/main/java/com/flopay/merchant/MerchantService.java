package com.flopay.merchant;

import com.flopay.audit.AuditLogService;
import com.flopay.common.ApiException;
import com.flopay.common.ClientIp;
import com.flopay.merchant.dto.MerchantDtos.AuthResponse;
import com.flopay.merchant.dto.MerchantDtos.LoginRequest;
import com.flopay.merchant.dto.MerchantDtos.SignupRequest;
import com.flopay.security.JwtService;
import com.flopay.security.PrincipalType;
import com.flopay.security.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;
    /** Spring injects a thread-local proxy here — safe as a singleton-scoped field. */
    private final HttpServletRequest httpServletRequest;

    /**
     * There is deliberately no self-service "become admin" flow — this is the
     * only way a merchant is ever granted {@link MerchantRole#ADMIN}, checked
     * (and re-applied) on every signup and login so editing the env var is
     * enough to promote or demote without touching the database by hand.
     */
    @Value("${flopay.admin.emails}")
    private String adminEmailsRaw;

    private static final String MERCHANT_VPA_DOMAIN = "@flopaybiz";
    private static final SecureRandom RANDOM = new SecureRandom();

    private Set<String> adminEmails() {
        return Arrays.stream(adminEmailsRaw.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (merchantRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        MerchantRole role = adminEmails().contains(request.email().toLowerCase())
                ? MerchantRole.ADMIN : MerchantRole.MERCHANT;
        Merchant merchant = Merchant.builder()
                .name(request.name())
                .email(request.email())
                .merchantVpa(generateMerchantVpa(request.name()))
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .build();
        merchant = merchantRepository.save(merchant);
        return toAuthResponse(merchant);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Merchant merchant = merchantRepository.findByEmail(request.email()).orElse(null);
        if (merchant == null || !passwordEncoder.matches(request.password(), merchant.getPasswordHash())) {
            auditLogService.record("MERCHANT", null, "MERCHANT_LOGIN_FAILED", request.email(), ClientIp.of(httpServletRequest));
            throw ApiException.unauthorized("Invalid email or password");
        }

        MerchantRole shouldBe = adminEmails().contains(merchant.getEmail().toLowerCase())
                ? MerchantRole.ADMIN : MerchantRole.MERCHANT;
        if (merchant.getRole() != shouldBe) {
            merchant.setRole(shouldBe);
            merchant = merchantRepository.save(merchant);
        }

        auditLogService.record("MERCHANT", merchant.getId(), "MERCHANT_LOGIN_SUCCESS", merchant.getEmail(), ClientIp.of(httpServletRequest));
        return toAuthResponse(merchant);
    }

    public Merchant getById(Long merchantId) {
        return merchantRepository.findById(merchantId)
                .orElseThrow(() -> ApiException.notFound("Merchant not found"));
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        RefreshTokenService.Rotated rotated = refreshTokenService.rotate(refreshToken, PrincipalType.MERCHANT);
        Merchant merchant = getById(rotated.principalId());
        String accessToken = jwtService.generateMerchantToken(merchant.getId(), merchant.getEmail(), merchant.getRole().name());
        return new AuthResponse(
                accessToken, rotated.rawToken(), merchant.getId(), merchant.getName(), merchant.getEmail(),
                merchant.getRole().name(), merchant.getMerchantVpa());
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    /** Slugified business name + a random numeric suffix, retried on collision — same shape as the consumer VpaService. */
    private String generateMerchantVpa(String name) {
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]", "");
        String base = slug.isBlank() ? "merchant" : (slug.length() > 20 ? slug.substring(0, 20) : slug);
        String candidate;
        do {
            candidate = base + RANDOM.nextInt(10_000) + MERCHANT_VPA_DOMAIN;
        } while (merchantRepository.existsByMerchantVpa(candidate));
        return candidate;
    }

    private AuthResponse toAuthResponse(Merchant merchant) {
        String token = jwtService.generateMerchantToken(merchant.getId(), merchant.getEmail(), merchant.getRole().name());
        String refreshToken = refreshTokenService.issue(PrincipalType.MERCHANT, merchant.getId());
        return new AuthResponse(
                token, refreshToken, merchant.getId(), merchant.getName(), merchant.getEmail(),
                merchant.getRole().name(), merchant.getMerchantVpa());
    }
}
