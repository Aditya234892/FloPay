package com.flopay.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ScheduledTransferRepository extends JpaRepository<ScheduledTransfer, UUID> {

    List<ScheduledTransfer> findByUserIdAndActiveTrueOrderByNextRunAtAsc(Long userId);

    List<ScheduledTransfer> findByActiveTrueAndNextRunAtLessThanEqual(Instant cutoff);
}
