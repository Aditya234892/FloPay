package com.flopay.topup;

import com.flopay.audit.AuditLogService;
import com.flopay.common.ApiException;
import com.flopay.common.ClientIp;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.consumer.WalletService;
import com.flopay.notification.NotificationService;
import com.flopay.notification.NotificationType;
import com.flopay.topup.dto.TopUpRequestDtos.AdminTopUpRequestResponse;
import com.flopay.topup.dto.TopUpRequestDtos.TopUpRequestResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TopUpRequestService {

    private final TopUpRequestRepository topUpRequestRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    @Transactional
    public TopUpRequestResponse create(Long userId, long amountMinor, String note) {
        TopUpRequest saved = topUpRequestRepository.save(TopUpRequest.builder()
                .userId(userId)
                .amountMinor(amountMinor)
                .note(note)
                .status(TopUpRequestStatus.PENDING)
                .build());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TopUpRequestResponse> listForUser(Long userId) {
        return topUpRequestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminTopUpRequestResponse> listPending() {
        return topUpRequestRepository.findByStatusOrderByCreatedAtAsc(TopUpRequestStatus.PENDING).stream()
                .map(this::toAdminResponse)
                .toList();
    }

    /**
     * Credits the wallet through the same {@link WalletService#topUp} path the
     * old instant-topup endpoint used, keyed on the request id so replaying
     * this call (e.g. a retried admin click) can never double-credit.
     */
    @Transactional
    public AdminTopUpRequestResponse approve(Long adminMerchantId, UUID requestId) {
        TopUpRequest request = requirePending(requestId);

        var entry = walletService.topUp(request.getUserId(), request.getAmountMinor(), "topup_request:" + request.getId());

        request.setStatus(TopUpRequestStatus.APPROVED);
        request.setDecidedByMerchantId(adminMerchantId);
        request.setDecidedAt(Instant.now());
        request.setSettledEntryId(entry.getId());
        topUpRequestRepository.save(request);

        notificationService.notify(
                request.getUserId(), NotificationType.TOPUP_APPROVED, "Add money approved",
                formatRupees(request.getAmountMinor()) + " was added to your wallet");
        auditLogService.record(
                "ADMIN", adminMerchantId, "ADMIN_TOPUP_APPROVED",
                "request=" + request.getId() + " user=" + request.getUserId() + " amount=" + request.getAmountMinor(),
                ClientIp.of(httpServletRequest));

        return toAdminResponse(request);
    }

    @Transactional
    public AdminTopUpRequestResponse reject(Long adminMerchantId, UUID requestId) {
        TopUpRequest request = requirePending(requestId);
        request.setStatus(TopUpRequestStatus.REJECTED);
        request.setDecidedByMerchantId(adminMerchantId);
        request.setDecidedAt(Instant.now());
        topUpRequestRepository.save(request);

        notificationService.notify(
                request.getUserId(), NotificationType.TOPUP_REJECTED, "Add money rejected",
                "Your request for " + formatRupees(request.getAmountMinor()) + " was rejected");
        auditLogService.record(
                "ADMIN", adminMerchantId, "ADMIN_TOPUP_REJECTED",
                "request=" + request.getId() + " user=" + request.getUserId() + " amount=" + request.getAmountMinor(),
                ClientIp.of(httpServletRequest));

        return toAdminResponse(request);
    }

    private static String formatRupees(long amountMinor) {
        return String.format("₹%,.2f", amountMinor / 100.0);
    }

    private TopUpRequest requirePending(UUID requestId) {
        TopUpRequest request = topUpRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));
        if (request.getStatus() != TopUpRequestStatus.PENDING) {
            throw ApiException.conflict("This request is already " + request.getStatus().name().toLowerCase());
        }
        return request;
    }

    private TopUpRequestResponse toResponse(TopUpRequest r) {
        return new TopUpRequestResponse(
                r.getId().toString(), r.getAmountMinor(), r.getNote(), r.getStatus(), r.getCreatedAt(), r.getDecidedAt());
    }

    private AdminTopUpRequestResponse toAdminResponse(TopUpRequest r) {
        User user = userRepository.findById(r.getUserId()).orElse(null);
        return new AdminTopUpRequestResponse(
                r.getId().toString(),
                r.getUserId(),
                user != null ? user.getVpa() : null,
                user != null ? user.getDisplayName() : null,
                r.getAmountMinor(),
                r.getNote(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getDecidedAt());
    }
}
