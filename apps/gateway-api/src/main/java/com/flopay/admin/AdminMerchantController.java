package com.flopay.admin;

import com.flopay.admin.dto.AdminMerchantDtos.AdminMerchantResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Gated by {@link SecurityUtils#requireAdminMerchant()}. */
@RestController
@RequestMapping("/api/dashboard/admin/merchants")
@RequiredArgsConstructor
public class AdminMerchantController {

    private final AdminMerchantService adminMerchantService;

    @GetMapping
    public List<AdminMerchantResponse> search(@RequestParam(required = false) String q) {
        SecurityUtils.requireAdminMerchant();
        return adminMerchantService.search(q);
    }
}
