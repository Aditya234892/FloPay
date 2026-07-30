package com.flopay.webhook;

import com.flopay.merchant.MerchantRepository;
import com.flopay.webhook.dto.WebhookDtos.WebhookConfigRequest;
import com.flopay.webhook.dto.WebhookDtos.WebhookConfigResponse;
import com.flopay.webhook.dto.WebhookDtos.WebhookLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookEndpointRepository webhookEndpointRepository;
    private final WebhookLogRepository webhookLogRepository;
    private final MerchantRepository merchantRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public WebhookConfigResponse configure(Long merchantId, WebhookConfigRequest request) {
        WebhookEndpoint endpoint = webhookEndpointRepository.findByMerchantId(merchantId)
                .orElseGet(() -> WebhookEndpoint.builder()
                        .merchant(merchantRepository.getReferenceById(merchantId))
                        .secret(generateSecret())
                        .build());
        endpoint.setUrl(request.url());
        endpoint = webhookEndpointRepository.save(endpoint);
        return new WebhookConfigResponse(endpoint.getUrl(), endpoint.getSecret());
    }

    public WebhookConfigResponse get(Long merchantId) {
        return webhookEndpointRepository.findByMerchantId(merchantId)
                .map(e -> new WebhookConfigResponse(e.getUrl(), e.getSecret()))
                .orElse(new WebhookConfigResponse(null, null));
    }

    public List<WebhookLogResponse> listLogs(Long merchantId) {
        return webhookLogRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(WebhookLogResponse::from)
                .toList();
    }

    private String generateSecret() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return "whsec_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
