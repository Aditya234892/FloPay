package com.flopay.webhook;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WebhookLogRepository extends JpaRepository<WebhookLog, Long> {
    List<WebhookLog> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
}
