package com.flopay.admin;

import com.flopay.admin.dto.AdminMerchantDtos.AdminMerchantResponse;
import com.flopay.merchant.ApiKeyRepository;
import com.flopay.merchant.Merchant;
import com.flopay.merchant.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminMerchantService {

    private final MerchantRepository merchantRepository;
    private final ApiKeyRepository apiKeyRepository;

    @Transactional(readOnly = true)
    public List<AdminMerchantResponse> search(String query) {
        return merchantRepository.search(query).stream().map(this::toResponse).toList();
    }

    private AdminMerchantResponse toResponse(Merchant merchant) {
        int activeKeys = (int) apiKeyRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId()).stream()
                .filter(key -> key.isActive())
                .count();
        return new AdminMerchantResponse(
                merchant.getId(), merchant.getName(), merchant.getEmail(), merchant.getRole().name(),
                activeKeys, merchant.getCreatedAt());
    }
}
