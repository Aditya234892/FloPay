package com.flopay.paymentlink;

import com.flopay.common.ApiException;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.paymentlink.dto.PaymentLinkDtos.CreatePaymentLinkRequest;
import com.flopay.paymentlink.dto.PaymentLinkDtos.PayViaLinkRequest;
import com.flopay.paymentlink.dto.PaymentLinkDtos.PaymentLinkPreviewResponse;
import com.flopay.paymentlink.dto.PaymentLinkDtos.PaymentLinkResponse;
import com.flopay.rewards.BadgeService;
import com.flopay.rewards.BadgeType;
import com.flopay.transfer.TransferService;
import com.flopay.transfer.dto.TransferDtos.TransferRequest;
import com.flopay.transfer.dto.TransferDtos.TransferResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentLinkService {

    private static final String CODE_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PaymentLinkRepository paymentLinkRepository;
    private final UserRepository userRepository;
    private final TransferService transferService;
    private final BadgeService badgeService;

    @Transactional
    public PaymentLinkResponse create(Long userId, CreatePaymentLinkRequest request) {
        PaymentLink saved = paymentLinkRepository.save(PaymentLink.builder()
                .code(generateUniqueCode())
                .creatorUserId(userId)
                .amountMinor(request.amountMinor())
                .note(request.note())
                .status(PaymentLinkStatus.ACTIVE)
                .build());
        badgeService.award(userId, BadgeType.LINK_CREATOR);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentLinkResponse> listForUser(Long userId) {
        return paymentLinkRepository.findByCreatorUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void disable(Long userId, UUID id) {
        PaymentLink link = paymentLinkRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Payment link not found"));
        if (!link.getCreatorUserId().equals(userId)) {
            throw ApiException.notFound("Payment link not found");
        }
        link.setStatus(PaymentLinkStatus.DISABLED);
        paymentLinkRepository.save(link);
    }

    @Transactional(readOnly = true)
    public PaymentLinkPreviewResponse preview(String code) {
        PaymentLink link = paymentLinkRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Payment link not found"));
        User creator = userRepository.findById(link.getCreatorUserId())
                .orElseThrow(() -> ApiException.notFound("Payment link not found"));

        return new PaymentLinkPreviewResponse(
                link.getCode(), creator.getVpa(), creator.getDisplayName(),
                link.getAmountMinor(), link.getNote(), link.getStatus() == PaymentLinkStatus.ACTIVE);
    }

    /**
     * The idempotency key is per-payment-attempt (client-generated, like a
     * regular transfer), not per-link — a payment link can be paid by many
     * different people, and by the same person more than once (e.g. a
     * recurring donation link), so the link id alone can't be the key.
     */
    @Transactional
    public TransferResponse pay(Long payerUserId, String code, PayViaLinkRequest request) {
        PaymentLink link = paymentLinkRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Payment link not found"));
        if (link.getStatus() != PaymentLinkStatus.ACTIVE) {
            throw ApiException.conflict("This payment link is no longer active");
        }

        Long amountMinor = link.getAmountMinor() != null ? link.getAmountMinor() : request.amountMinor();
        if (amountMinor == null || amountMinor <= 0) {
            throw ApiException.badRequest("Enter an amount to pay");
        }

        User creator = userRepository.findById(link.getCreatorUserId())
                .orElseThrow(() -> ApiException.notFound("Payment link not found"));
        if (creator.getId().equals(payerUserId)) {
            throw ApiException.badRequest("You can't pay your own payment link");
        }

        return transferService.transfer(payerUserId, new TransferRequest(
                creator.getVpa(), amountMinor, link.getNote(), request.idempotencyKey()));
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            code = sb.toString();
        } while (paymentLinkRepository.existsByCode(code));
        return code;
    }

    private PaymentLinkResponse toResponse(PaymentLink link) {
        return new PaymentLinkResponse(
                link.getId().toString(), link.getCode(), link.getAmountMinor(), link.getNote(),
                link.getStatus(), link.getCreatedAt());
    }
}
