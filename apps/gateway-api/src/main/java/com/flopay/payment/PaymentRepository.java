package com.flopay.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByIdAndOrderMerchantId(String id, Long merchantId);

    List<Payment> findByOrderMerchantIdOrderByCreatedAtDesc(Long merchantId);
}
