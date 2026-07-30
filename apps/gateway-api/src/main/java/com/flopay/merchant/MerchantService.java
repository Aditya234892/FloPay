package com.flopay.merchant;

import com.flopay.common.ApiException;
import com.flopay.merchant.dto.MerchantDtos.AuthResponse;
import com.flopay.merchant.dto.MerchantDtos.LoginRequest;
import com.flopay.merchant.dto.MerchantDtos.SignupRequest;
import com.flopay.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (merchantRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        Merchant merchant = Merchant.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();
        merchant = merchantRepository.save(merchant);
        return toAuthResponse(merchant);
    }

    public AuthResponse login(LoginRequest request) {
        Merchant merchant = merchantRepository.findByEmail(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), merchant.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        return toAuthResponse(merchant);
    }

    public Merchant getById(Long merchantId) {
        return merchantRepository.findById(merchantId)
                .orElseThrow(() -> ApiException.notFound("Merchant not found"));
    }

    private AuthResponse toAuthResponse(Merchant merchant) {
        String token = jwtService.generateToken(merchant.getId(), merchant.getEmail());
        return new AuthResponse(token, merchant.getId(), merchant.getName(), merchant.getEmail());
    }
}
