package com.flopay.order;

import com.flopay.merchant.Merchant;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    /** Smallest currency unit, e.g. paise for INR — mirrors Razorpay's amount convention. */
    @Column(nullable = false)
    private Long amount;

    @Builder.Default
    @Column(nullable = false)
    private String currency = "INR";

    private String receipt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.CREATED;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
