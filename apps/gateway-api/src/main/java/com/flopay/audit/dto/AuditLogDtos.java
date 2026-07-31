package com.flopay.audit.dto;

import java.time.Instant;

public class AuditLogDtos {

    private AuditLogDtos() {
    }

    public record AuditLogResponse(
            String id,
            String actorType,
            Long actorId,
            String action,
            String details,
            String ipAddress,
            Instant createdAt
    ) {
    }
}
