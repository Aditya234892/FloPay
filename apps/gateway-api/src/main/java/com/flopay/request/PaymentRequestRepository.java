package com.flopay.request;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {

    List<PaymentRequest> findByPayerUserIdOrderByCreatedAtDesc(Long payerUserId);

    List<PaymentRequest> findByRequesterUserIdOrderByCreatedAtDesc(Long requesterUserId);

    List<PaymentRequest> findBySplitGroupIdOrderByCreatedAtAsc(UUID splitGroupId);

    long countByPayerUserIdAndStatus(Long payerUserId, PaymentRequestStatus status);

    /**
     * Locks the row so two concurrent approvals of the same request cannot both
     * read it as PENDING and both trigger a transfer. The transfer itself is
     * separately idempotent (keyed on the request id), so this is belt and
     * braces — but the status transition needs its own guard regardless, or the
     * second caller would overwrite settledEntryId with a different entry.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from PaymentRequest r where r.id = :id")
    Optional<PaymentRequest> findByIdForUpdate(@Param("id") UUID id);
}
