package com.flopay.admin;

import com.flopay.admin.dto.AdminUserDtos.AdminUserResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gated by {@link SecurityUtils#requireAdminMerchant()} — every method here rejects a non-admin merchant. */
@RestController
@RequestMapping("/api/dashboard/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<AdminUserResponse> search(@RequestParam(required = false) String q) {
        SecurityUtils.requireAdminMerchant();
        return adminUserService.search(q);
    }

    @PostMapping("/{userId}/freeze")
    public AdminUserResponse freeze(@PathVariable Long userId) {
        Long adminId = SecurityUtils.requireAdminMerchant();
        return adminUserService.setFrozen(adminId, userId, true);
    }

    @PostMapping("/{userId}/unfreeze")
    public AdminUserResponse unfreeze(@PathVariable Long userId) {
        Long adminId = SecurityUtils.requireAdminMerchant();
        return adminUserService.setFrozen(adminId, userId, false);
    }
}
