package com.flopay.webhook;

import com.flopay.webhook.dto.WebhookDtos.WebhookConfigRequest;
import com.flopay.webhook.dto.WebhookDtos.WebhookConfigResponse;
import com.flopay.webhook.dto.WebhookDtos.WebhookLogResponse;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @PutMapping
    public WebhookConfigResponse configure(@Valid @RequestBody WebhookConfigRequest request) {
        return webhookService.configure(SecurityUtils.currentMerchantId(), request);
    }

    @GetMapping
    public WebhookConfigResponse get() {
        return webhookService.get(SecurityUtils.currentMerchantId());
    }

    @GetMapping("/logs")
    public List<WebhookLogResponse> logs() {
        return webhookService.listLogs(SecurityUtils.currentMerchantId());
    }
}
