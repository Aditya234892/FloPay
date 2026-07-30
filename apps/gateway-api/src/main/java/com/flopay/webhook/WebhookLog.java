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

    @Lob
    @Column(nullable = false)
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
