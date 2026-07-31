package com.flopay.notification.dto;

import com.flopay.notification.NotificationType;

import java.time.Instant;

public class NotificationDtos {

    private NotificationDtos() {
    }

    public record NotificationResponse(
            String id,
            NotificationType type,
            String title,
            String body,
            boolean read,
            Instant createdAt
    ) {
    }

    public record UnreadCountResponse(long count) {
    }
}
