package com.flopay.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flopay.payment.SignatureUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Delivers signed webhook events to a merchant's configured URL, retrying transient failures —
 * mirrors Razorpay's webhook delivery + X-Razorpay-Signature verification scheme.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookDispatcher {

    private static final int MAX_ATTEMPTS = 3;
    private static final long RETRY_BACKOFF_MS = 500;

    private final WebhookEndpointRepository webhookEndpointRepository;
    private final WebhookLogRepository webhookLogRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Async("webhookExecutor")
    public void dispatch(Long merchantId, WebhookEventType eventType, Object data) {
        Optional<WebhookEndpoint> endpointOpt = webhookEndpointRepository.findByMerchantId(merchantId);
        if (endpointOpt.isEmpty()) {
            return; // merchant hasn't configured a webhook URL yet
        }
        WebhookEndpoint endpoint = endpointOpt.get();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("event", eventType.name().toLowerCase());
        body.put("created_at", Instant.now().toString());
        body.put("payload", data);

        String json;
        try {
            json = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            log.error("Failed to serialize webhook payload for merchant {}", merchantId, e);
            return;
        }

        String signature = SignatureUtil.sign(json, endpoint.getSecret());

        WebhookLog logEntry = WebhookLog.builder()
                .merchantId(merchantId)
                .eventType(eventType)
                .payload(json)
                .delivered(false)
                .attempts(0)
                .build();

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            logEntry.setAttempts(attempt);
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.set("Content-Type", "application/json");
                headers.set("X-FloPay-Signature", signature);
                HttpStatusCode status = restTemplate.postForEntity(
                        endpoint.getUrl(), new HttpEntity<>(json, headers), Void.class
                ).getStatusCode();
                logEntry.setLastResponseStatus(status.value());
                if (status.is2xxSuccessful()) {
                    logEntry.setDelivered(true);
                    break;
                }
            } catch (RestClientException e) {
                log.warn("Webhook delivery attempt {} failed for merchant {}: {}", attempt, merchantId, e.getMessage());
            }
            if (attempt < MAX_ATTEMPTS) {
                sleep(RETRY_BACKOFF_MS * attempt);
            }
        }

        webhookLogRepository.save(logEntry);
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
