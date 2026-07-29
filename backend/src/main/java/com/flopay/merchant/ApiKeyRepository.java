package com.flopay.merchant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    Optional<ApiKey> findByKeyIdAndActiveTrue(String keyId);

    List<ApiKey> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);

    Optional<ApiKey> findByKeyIdAndMerchantId(String keyId, Long merchantId);
}
