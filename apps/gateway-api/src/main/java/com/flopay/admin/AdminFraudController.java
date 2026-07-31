package com.flopay.admin;

import com.flopay.admin.dto.FraudSignalDtos.FraudSignalResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Gated by {@link SecurityUtils#requireAdminMerchant()}. */
@RestController
@RequestMapping("/api/dashboard/admin/fraud-signals")
@RequiredArgsConstructor
public class AdminFraudController {

    private final AdminFraudService adminFraudService;

    @GetMapping
    public List<FraudSignalResponse> velocityOutliers() {
        SecurityUtils.requireAdminMerchant();
        return adminFraudService.velocityOutliers();
    }
}
