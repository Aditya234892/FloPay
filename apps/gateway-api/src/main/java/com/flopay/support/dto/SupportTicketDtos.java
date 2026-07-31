package com.flopay.support.dto;

import com.flopay.support.SupportTicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class SupportTicketDtos {

    private SupportTicketDtos() {
    }

    public record CreateTicketRequest(
            @NotBlank @Size(max = 140) String subject,
            @NotBlank @Size(max = 2000) String message
    ) {
    }

    public record ResolveTicketRequest(
            @NotBlank @Size(max = 2000) String response
    ) {
    }

    public record TicketResponse(
            String id,
            String subject,
            String message,
            SupportTicketStatus status,
            String adminResponse,
            Instant createdAt,
            Instant resolvedAt
    ) {
    }

    public record AdminTicketResponse(
            String id,
            String requesterType,
            Long requesterId,
            /** Best-effort VPA/email of the requester, resolved for display — null if the account was since deleted. */
            String requesterLabel,
            String subject,
            String message,
            SupportTicketStatus status,
            String adminResponse,
            Instant createdAt,
            Instant resolvedAt
    ) {
    }
}
