package com.flopay.refund;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefundRepository extends JpaRepository<Refund, String> {
    List<Refund> findByPaymentId(String paymentId);

    List<Refund> findByPaymentOrderMerchantIdOrderByCreatedAtDesc(Long merchantId);
}
