package com.flopay.topup;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopUpRequestRepository extends JpaRepository<TopUpRequest, UUID> {

    List<TopUpRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<TopUpRequest> findByStatusOrderByCreatedAtAsc(TopUpRequestStatus status);

    /** Same reasoning as PaymentRequestRepository.findByIdForUpdate — guards the PENDING transition. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from TopUpRequest r where r.id = :id")
    Optional<TopUpRequest> findByIdForUpdate(@Param("id") UUID id);
}
