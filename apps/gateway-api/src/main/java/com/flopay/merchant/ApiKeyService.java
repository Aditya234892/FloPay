package com.flopay.merchant;

import com.flopay.common.ApiException;
import com.flopay.common.IdGenerator;
import com.flopay.merchant.dto.ApiKeyDtos.ApiKeyCreatedResponse;
import com.flopay.merchant.dto.ApiKeyDtos.ApiKeySummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final MerchantRepository merchantRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public ApiKeyCreatedResponse createKey(Long merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> ApiException.notFound("Merchant not found"));

        String keyId = IdGenerator.generate("flo_test_");
        String keySecret = "sk_test_" + UUID.randomUUID().toString().replace("-", "");

        ApiKey apiKey = ApiKey.builder()
                .keyId(keyId)
                .keySecretHash(passwordEncoder.encode(keySecret))
                .merchant(merchant)
                .active(true)
                .build();
        apiKey = apiKeyRepository.save(apiKey);

        return new ApiKeyCreatedResponse(apiKey.getKeyId(), keySecret, apiKey.isActive(), apiKey.getCreatedAt());
    }

    public List<ApiKeySummaryResponse> listKeys(Long merchantId) {
        return apiKeyRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(k -> new ApiKeySummaryResponse(k.getKeyId(), k.isActive(), k.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void revokeKey(Long merchantId, String keyId) {
        ApiKey apiKey = apiKeyRepository.findByKeyIdAndMerchantId(keyId, merchantId)
                .orElseThrow(() -> ApiException.notFound("API key not found"));
        apiKey.setActive(false);
        apiKeyRepository.save(apiKey);
    }
}
