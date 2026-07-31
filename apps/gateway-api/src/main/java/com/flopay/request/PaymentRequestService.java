package com.flopay.request;

import com.flopay.common.ApiException;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.notification.NotificationService;
import com.flopay.notification.NotificationType;
import com.flopay.request.dto.PaymentRequestDtos.CreateSplitRequest;
import com.flopay.request.dto.PaymentRequestDtos.PaymentRequestResponse;
import com.flopay.request.dto.PaymentRequestDtos.SplitSummaryResponse;
import com.flopay.transfer.TransferService;
import com.flopay.transfer.dto.TransferDtos.TransferRequest;
import com.flopay.transfer.dto.TransferDtos.TransferResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final UserRepository userRepository;
    private final TransferService transferService;
    private final NotificationService notificationService;

    @Transactional
    public PaymentRequestResponse create(Long requesterUserId, String fromVpa, long amountMinor, String note) {
        User payer = resolveVpa(fromVpa);
        if (payer.getId().equals(requesterUserId)) {
            throw ApiException.badRequest("You can't request money from yourself");
        }

        PaymentRequest saved = paymentRequestRepository.save(PaymentRequest.builder()
                .requesterUserId(requesterUserId)
                .payerUserId(payer.getId())
                .amountMinor(amountMinor)
                .note(note)
                .status(PaymentRequestStatus.PENDING)
                .build());

        notifyRequested(requesterUserId, payer.getId(), amountMinor);

        return toResponse(saved, requesterUserId);
    }

    @Transactional
    public SplitSummaryResponse createSplit(Long requesterUserId, CreateSplitRequest request) {
        // Deduplicate first: asking the same person twice for a share of one
        // bill is always a mistake, and it would silently shrink everyone
        // else's share since the split is computed from the payer count.
        List<String> distinctVpas = request.payerVpas().stream()
                .map(vpa -> vpa.trim().toLowerCase()).distinct().toList();

        List<User> payers = new ArrayList<>();
        for (String vpa : distinctVpas) {
            User payer = resolveVpa(vpa);
            if (payer.getId().equals(requesterUserId)) {
                throw ApiException.badRequest("You can't include yourself as a payer in your own split");
            }
            payers.add(payer);
        }

        List<Long> shares = SplitCalculator.splitEvenly(request.totalAmountMinor(), payers.size());
        UUID splitGroupId = UUID.randomUUID();

        List<PaymentRequestResponse> created = new ArrayList<>();
        for (int i = 0; i < payers.size(); i++) {
            PaymentRequest saved = paymentRequestRepository.save(PaymentRequest.builder()
                    .requesterUserId(requesterUserId)
                    .payerUserId(payers.get(i).getId())
                    .amountMinor(shares.get(i))
                    .note(request.note())
                    .status(PaymentRequestStatus.PENDING)
                    .splitGroupId(splitGroupId)
                    .build());
            notifyRequested(requesterUserId, payers.get(i).getId(), shares.get(i));
            created.add(toResponse(saved, requesterUserId));
        }

        return new SplitSummaryResponse(
                splitGroupId.toString(), request.totalAmountMinor(), request.note(), created);
    }

    /**
     * Pays a pending request. The transfer is keyed on the request id, so a
     * retried approval settles the same ledger entry rather than paying twice.
     */
    @Transactional
    public PaymentRequestResponse approve(Long payerUserId, UUID requestId) {
        PaymentRequest request = paymentRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        if (!request.getPayerUserId().equals(payerUserId)) {
            // Deliberately the same message as a missing request — telling a
            // stranger "that request exists but isn't yours" leaks that a given
            // request id is real.
            throw ApiException.notFound("Request not found");
        }
        if (request.getStatus() != PaymentRequestStatus.PENDING) {
            throw ApiException.conflict("This request is already " + request.getStatus().name().toLowerCase());
        }

        User requester = userRepository.findById(request.getRequesterUserId())
                .orElseThrow(() -> ApiException.notFound("Requester no longer exists"));

        TransferResponse transfer = transferService.transfer(payerUserId, new TransferRequest(
                requester.getVpa(),
                request.getAmountMinor(),
                request.getNote(),
                "payment-request-" + request.getId()));

        request.setStatus(PaymentRequestStatus.PAID);
        request.setSettledEntryId(UUID.fromString(transfer.entryId()));
        paymentRequestRepository.save(request);

        return toResponse(request, payerUserId);
    }

    @Transactional
    public PaymentRequestResponse decline(Long payerUserId, UUID requestId) {
        return transition(requestId, payerUserId, true, PaymentRequestStatus.DECLINED);
    }

    @Transactional
    public PaymentRequestResponse cancel(Long requesterUserId, UUID requestId) {
        return transition(requestId, requesterUserId, false, PaymentRequestStatus.CANCELLED);
    }

    private PaymentRequestResponse transition(
            UUID requestId, Long actingUserId, boolean actorIsPayer, PaymentRequestStatus target
    ) {
        PaymentRequest request = paymentRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        Long allowedUserId = actorIsPayer ? request.getPayerUserId() : request.getRequesterUserId();
        if (!allowedUserId.equals(actingUserId)) {
            throw ApiException.notFound("Request not found");
        }
        if (request.getStatus() != PaymentRequestStatus.PENDING) {
            throw ApiException.conflict("This request is already " + request.getStatus().name().toLowerCase());
        }

        request.setStatus(target);
        paymentRequestRepository.save(request);

        // Only DECLINED needs telling the other side — CANCELLED is the
        // requester acting on their own request, nothing to notify themselves
        // about.
        if (target == PaymentRequestStatus.DECLINED) {
            User payer = userRepository.findById(request.getPayerUserId()).orElse(null);
            String payerLabel = payer != null && payer.getDisplayName() != null ? payer.getDisplayName() : "They";
            notificationService.notify(
                    request.getRequesterUserId(), NotificationType.REQUEST_DECLINED, "Request declined",
                    payerLabel + " declined your request for " + formatRupees(request.getAmountMinor()));
        }

        return toResponse(request, actingUserId);
    }

    private void notifyRequested(Long requesterUserId, Long payerId, long amountMinor) {
        User requester = userRepository.findById(requesterUserId).orElse(null);
        String requesterLabel = requester != null && requester.getDisplayName() != null ? requester.getDisplayName() : "Someone";
        notificationService.notify(
                payerId, NotificationType.REQUEST_RECEIVED, "Money requested",
                requesterLabel + " requested " + formatRupees(amountMinor) + " from you");
    }

    private static String formatRupees(long amountMinor) {
        return String.format("₹%,.2f", amountMinor / 100.0);
    }

    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> listIncoming(Long userId) {
        return toResponses(paymentRequestRepository.findByPayerUserIdOrderByCreatedAtDesc(userId), userId);
    }

    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> listOutgoing(Long userId) {
        return toResponses(paymentRequestRepository.findByRequesterUserIdOrderByCreatedAtDesc(userId), userId);
    }

    @Transactional(readOnly = true)
    public long countPendingIncoming(Long userId) {
        return paymentRequestRepository.countByPayerUserIdAndStatus(userId, PaymentRequestStatus.PENDING);
    }

    private User resolveVpa(String vpa) {
        String normalized = vpa.trim().toLowerCase();
        return userRepository.findByVpa(normalized)
                .orElseThrow(() -> ApiException.badRequest("No FloPay user with VPA " + normalized));
    }

    /** Batches the counterparty lookups so a list of N requests costs one user query, not N. */
    private List<PaymentRequestResponse> toResponses(List<PaymentRequest> requests, Long viewerUserId) {
        List<Long> counterpartyIds = requests.stream()
                .map(r -> r.getPayerUserId().equals(viewerUserId) ? r.getRequesterUserId() : r.getPayerUserId())
                .distinct()
                .toList();

        Map<Long, User> usersById = new LinkedHashMap<>();
        userRepository.findAllById(counterpartyIds).forEach(u -> usersById.put(u.getId(), u));

        return requests.stream().map(r -> toResponse(r, viewerUserId, usersById)).toList();
    }

    private PaymentRequestResponse toResponse(PaymentRequest request, Long viewerUserId) {
        return toResponse(request, viewerUserId, Map.of());
    }

    private PaymentRequestResponse toResponse(
            PaymentRequest request, Long viewerUserId, Map<Long, User> prefetched
    ) {
        boolean incoming = request.getPayerUserId().equals(viewerUserId);
        Long counterpartyId = incoming ? request.getRequesterUserId() : request.getPayerUserId();

        User counterparty = prefetched.get(counterpartyId);
        if (counterparty == null) {
            counterparty = userRepository.findById(counterpartyId).orElse(null);
        }

        return new PaymentRequestResponse(
                request.getId().toString(),
                incoming,
                counterparty != null ? counterparty.getVpa() : null,
                counterparty != null ? counterparty.getDisplayName() : null,
                request.getAmountMinor(),
                request.getNote(),
                request.getStatus(),
                request.getSplitGroupId() != null ? request.getSplitGroupId().toString() : null,
                request.getCreatedAt());
    }
}
