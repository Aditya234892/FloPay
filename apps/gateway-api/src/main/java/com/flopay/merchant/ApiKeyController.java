package com.flopay.merchant;

import com.flopay.merchant.dto.ApiKeyDtos.ApiKeyCreatedResponse;
import com.flopay.merchant.dto.ApiKeyDtos.ApiKeySummaryResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @PostMapping
    public ResponseEntity<ApiKeyCreatedResponse> create() {
        ApiKeyCreatedResponse created = apiKeyService.createKey(SecurityUtils.currentMerchantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<ApiKeySummaryResponse> list() {
        return apiKeyService.listKeys(SecurityUtils.currentMerchantId());
    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<Void> revoke(@PathVariable String keyId) {
        apiKeyService.revokeKey(SecurityUtils.currentMerchantId(), keyId);
        return ResponseEntity.noContent().build();
    }
}
