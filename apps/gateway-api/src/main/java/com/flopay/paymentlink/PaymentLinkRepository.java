package com.flopay.paymentlink;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentLinkRepository extends JpaRepository<PaymentLink, UUID> {

    Optional<PaymentLink> findByCode(String code);

    List<PaymentLink> findByCreatorUserIdOrderByCreatedAtDesc(Long creatorUserId);

    boolean existsByCode(String code);
}
