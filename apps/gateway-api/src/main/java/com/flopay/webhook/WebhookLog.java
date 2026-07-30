package com.flopay.webhook;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "webhook_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long merchantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WebhookEventType eventType;

    /**
     * Plain TEXT, not @Lob: Hibernate 6 on PostgreSQL maps a bare `@Lob String`
     * to `oid` (large-object) rather than `text` depending on dialect version —
     * ambiguous enough that a schema-validation tool would rather fail loudly
     * than guess. This column only ever holds a JSON event body.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Builder.Default
    @Column(nullable = false)
    private boolean delivered = false;

    @Builder.Default
    @Column(nullable = false)
    private int attempts = 0;

    private Integer lastResponseStatus;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
