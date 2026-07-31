package com.flopay.audit;

import com.flopay.audit.dto.AuditLogDtos.AuditLogResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** System logs, for the admin panel — gated by {@link SecurityUtils#requireAdminMerchant()}. */
@RestController
@RequestMapping("/api/dashboard/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public List<AuditLogResponse> recent() {
        SecurityUtils.requireAdminMerchant();
        return auditLogService.recent();
    }
}
