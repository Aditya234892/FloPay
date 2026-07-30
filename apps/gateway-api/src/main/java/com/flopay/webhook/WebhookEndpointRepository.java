package com.flopay.webhook;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpoint, Long> {
    Optional<WebhookEndpoint> findByMerchantId(Long merchantId);
}
