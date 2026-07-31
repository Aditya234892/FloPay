package com.flopay.support;

import com.flopay.common.ApiException;
import com.flopay.consumer.UserRepository;
import com.flopay.merchant.MerchantRepository;
import com.flopay.security.PrincipalType;
import com.flopay.support.dto.SupportTicketDtos.AdminTicketResponse;
import com.flopay.support.dto.SupportTicketDtos.CreateTicketRequest;
import com.flopay.support.dto.SupportTicketDtos.TicketResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final MerchantRepository merchantRepository;

    @Transactional
    public TicketResponse create(PrincipalType requesterType, Long requesterId, CreateTicketRequest request) {
        SupportTicket saved = supportTicketRepository.save(SupportTicket.builder()
                .requesterType(requesterType)
                .requesterId(requesterId)
                .subject(request.subject().trim())
                .message(request.message().trim())
                .status(SupportTicketStatus.OPEN)
                .build());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> listForRequester(PrincipalType requesterType, Long requesterId) {
        return supportTicketRepository.findByRequesterTypeAndRequesterIdOrderByCreatedAtDesc(requesterType, requesterId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminTicketResponse> adminList() {
        return supportTicketRepository.findAllByOrderByStatusAscCreatedAtDesc().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional
    public AdminTicketResponse resolve(UUID ticketId, String response) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Ticket not found"));
        ticket.setAdminResponse(response.trim());
        ticket.setStatus(SupportTicketStatus.RESOLVED);
        ticket.setResolvedAt(Instant.now());
        return toAdminResponse(supportTicketRepository.save(ticket));
    }

    private String requesterLabel(SupportTicket ticket) {
        if (ticket.getRequesterType() == PrincipalType.USER) {
            return userRepository.findById(ticket.getRequesterId()).map(u -> u.getVpa()).orElse(null);
        }
        return merchantRepository.findById(ticket.getRequesterId()).map(m -> m.getEmail()).orElse(null);
    }

    private TicketResponse toResponse(SupportTicket ticket) {
        return new TicketResponse(
                ticket.getId().toString(), ticket.getSubject(), ticket.getMessage(), ticket.getStatus(),
                ticket.getAdminResponse(), ticket.getCreatedAt(), ticket.getResolvedAt());
    }

    private AdminTicketResponse toAdminResponse(SupportTicket ticket) {
        return new AdminTicketResponse(
                ticket.getId().toString(), ticket.getRequesterType().name(), ticket.getRequesterId(),
                requesterLabel(ticket), ticket.getSubject(), ticket.getMessage(), ticket.getStatus(),
                ticket.getAdminResponse(), ticket.getCreatedAt(), ticket.getResolvedAt());
    }
}
