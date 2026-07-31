package com.flopay.merchantpay;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MerchantWalletPaymentRepository extends JpaRepository<MerchantWalletPayment, UUID> {

    List<MerchantWalletPayment> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
}
