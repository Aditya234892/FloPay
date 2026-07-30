package com.flopay.webhook.dto;

import com.flopay.webhook.WebhookEventType;
import com.flopay.webhook.WebhookLog;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class WebhookDtos {

    private WebhookDtos() {
    }

    public record WebhookConfigRequest(@NotBlank String url) {
    }

    public record WebhookConfigResponse(String url, String secret) {
    }

    public record WebhookLogResponse(
            Long id,
            WebhookEventType eventType,
            boolean delivered,
            int attempts,
            Integer lastResponseStatus,
            Instant createdAt
    ) {
        public static WebhookLogResponse from(WebhookLog log) {
            return new WebhookLogResponse(
                    log.getId(), log.getEventType(), log.isDelivered(),
                    log.getAttempts(), log.getLastResponseStatus(), log.getCreatedAt()
            );
        }
    }
}
