package com.flopay.transfer;

import com.flopay.common.ApiException;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.JournalEntry;
import com.flopay.ledger.JournalEntryRepository;
import com.flopay.ledger.LedgerService;
import com.flopay.ledger.PostingLine;
import com.flopay.notification.NotificationService;
import com.flopay.notification.NotificationType;
import com.flopay.rewards.BadgeService;
import com.flopay.rewards.ReferralService;
import com.flopay.rewards.RewardsService;
import com.flopay.transfer.dto.TransferDtos.TransferRequest;
import com.flopay.transfer.dto.TransferDtos.TransferResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final String CURRENCY = "INR";

    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final JournalEntryRepository journalEntryRepository;
    private final NotificationService notificationService;
    private final RewardsService rewardsService;
    private final ReferralService referralService;
    private final BadgeService badgeService;

    public TransferResponse transfer(Long senderUserId, TransferRequest request) {
        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (sender.isFrozen()) {
            throw ApiException.forbidden("Your account is frozen. Contact support.");
        }

        User receiver = userRepository.findByVpa(request.toVpa().trim().toLowerCase())
                .orElseThrow(() -> ApiException.badRequest("No FloPay user with that VPA"));

        if (receiver.getId().equals(senderUserId)) {
            throw ApiException.badRequest("You can't send money to yourself");
        }

        // Checked before posting, not after: post() itself is the idempotency
        // boundary (replays return the original entry without moving money
        // again), so this is the only reliable way to know whether THIS call
        // actually just created the entry — a replay must not re-notify.
        boolean isReplay = journalEntryRepository.findByIdempotencyKey(request.idempotencyKey()).isPresent();

        Account senderWallet = ledgerService.getAccount(AccountOwnerType.USER, senderUserId, AccountKind.WALLET, CURRENCY);
        Account receiverWallet = ledgerService.getAccount(AccountOwnerType.USER, receiver.getId(), AccountKind.WALLET, CURRENCY);

        JournalEntry entry = ledgerService.post(
                request.idempotencyKey(), "P2P_TRANSFER", null, request.note(),
                List.of(
                        PostingLine.debit(senderWallet.getId(), request.amountMinor()),
                        PostingLine.credit(receiverWallet.getId(), request.amountMinor())));

        if (!isReplay) {
            String senderLabel = sender.getDisplayName() != null ? sender.getDisplayName() : "Someone";
            notificationService.notify(
                    receiver.getId(), NotificationType.MONEY_RECEIVED, "Money received",
                    senderLabel + " sent you " + formatRupees(request.amountMinor()));
            // 1% cashback on money sent — this also covers request-settlement,
            // since PaymentRequestService.approve() calls this same method.
            rewardsService.awardCashback(senderUserId, request.amountMinor(), entry.getId().toString());
            // A no-op unless the sender redeemed a referral code and this is
            // their first transfer ever — see ReferralService for why the
            // bonus is paid here rather than at signup.
            referralService.maybeRewardOnFirstTransfer(senderUserId);
            badgeService.evaluateAfterTransfer(senderUserId);
        }

        return new TransferResponse(
                entry.getId().toString(), receiver.getVpa(), receiver.getDisplayName(),
                request.amountMinor(), request.note(), entry.getCreatedAt());
    }

    private static String formatRupees(long amountMinor) {
        return String.format("₹%,.2f", amountMinor / 100.0);
    }
}
