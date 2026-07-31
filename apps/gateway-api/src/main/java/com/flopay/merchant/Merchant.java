package com.flopay.merchant;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "merchants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Merchant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    /** How consumer wallet users pay this merchant — e.g. "coffeehouse4821@flopaybiz". Distinct domain from consumer VPAs so a client can tell the two apart without a lookup. */
    @Column(nullable = false, unique = true, length = 64)
    private String merchantVpa;

    @Column(nullable = false)
    private String passwordHash;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MerchantRole role = MerchantRole.MERCHANT;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
