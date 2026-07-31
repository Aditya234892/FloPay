package com.flopay.consumer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A VPA a user has explicitly starred — distinct from "recent people", which is just derived from transaction history. */
@Entity
@Table(name = "favorite_contact")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String vpa;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
