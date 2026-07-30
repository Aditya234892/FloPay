package com.flopay.consumer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A wallet-app consumer, identified by phone number rather than email/password. */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String phone;

    /** e.g. "raj9821@flopay" — how other users send this person money. */
    @Column(nullable = false, unique = true)
    private String vpa;

    private String displayName;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
