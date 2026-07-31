package com.flopay.support;

import com.flopay.security.PrincipalType;
import com.flopay.security.SecurityUtils;
import com.flopay.support.dto.SupportTicketDtos.CreateTicketRequest;
import com.flopay.support.dto.SupportTicketDtos.TicketResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Consumer wallet app's own support tickets — the merchant/admin side lives in {@link com.flopay.admin}. */
@RestController
@RequestMapping("/api/wallet/support/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    @PostMapping
    public ResponseEntity<TicketResponse> create(@Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(supportTicketService.create(PrincipalType.USER, SecurityUtils.currentUserId(), request));
    }

    @GetMapping
    public List<TicketResponse> list() {
        return supportTicketService.listForRequester(PrincipalType.USER, SecurityUtils.currentUserId());
    }
}
