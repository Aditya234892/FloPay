package com.flopay.topup;

import com.flopay.security.SecurityUtils;
import com.flopay.topup.dto.TopUpRequestDtos.AdminTopUpRequestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Gated by {@link SecurityUtils#requireAdminMerchant()} — every method here rejects a non-admin merchant. */
@RestController
@RequestMapping("/api/dashboard/admin/topup-requests")
@RequiredArgsConstructor
public class AdminTopUpRequestController {

    private final TopUpRequestService topUpRequestService;

    @GetMapping
    public List<AdminTopUpRequestResponse> pending() {
        SecurityUtils.requireAdminMerchant();
        return topUpRequestService.listPending();
    }

    @PostMapping("/{requestId}/approve")
    public AdminTopUpRequestResponse approve(@PathVariable UUID requestId) {
        Long adminId = SecurityUtils.requireAdminMerchant();
        return topUpRequestService.approve(adminId, requestId);
    }

    @PostMapping("/{requestId}/reject")
    public AdminTopUpRequestResponse reject(@PathVariable UUID requestId) {
        Long adminId = SecurityUtils.requireAdminMerchant();
        return topUpRequestService.reject(adminId, requestId);
    }
}
