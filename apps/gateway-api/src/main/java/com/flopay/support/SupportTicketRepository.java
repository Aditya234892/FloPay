package com.flopay.support;

import com.flopay.security.PrincipalType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    List<SupportTicket> findByRequesterTypeAndRequesterIdOrderByCreatedAtDesc(
            PrincipalType requesterType, Long requesterId);

    List<SupportTicket> findAllByOrderByStatusAscCreatedAtDesc();
}
