package com.flopay.admin;

import com.flopay.security.SecurityUtils;
import com.flopay.support.SupportTicketService;
import com.flopay.support.dto.SupportTicketDtos.AdminTicketResponse;
import com.flopay.support.dto.SupportTicketDtos.ResolveTicketRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Gated by {@link SecurityUtils#requireAdminMerchant()}. */
@RestController
@RequestMapping("/api/dashboard/admin/support-tickets")
@RequiredArgsConstructor
public class AdminSupportTicketController {

    private final SupportTicketService supportTicketService;

    @GetMapping
    public List<AdminTicketResponse> list() {
        SecurityUtils.requireAdminMerchant();
        return supportTicketService.adminList();
    }

    @PostMapping("/{ticketId}/resolve")
    public AdminTicketResponse resolve(@PathVariable UUID ticketId, @Valid @RequestBody ResolveTicketRequest request) {
        SecurityUtils.requireAdminMerchant();
        return supportTicketService.resolve(ticketId, request.response());
    }
}
