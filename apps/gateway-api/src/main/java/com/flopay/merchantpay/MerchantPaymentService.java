package com.flopay.merchantpay;

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
import com.flopay.merchant.Merchant;
import com.flopay.merchant.MerchantRepository;
import com.flopay.merchantpay.dto.MerchantPaymentDtos.MerchantPaymentResponse;
import com.flopay.merchantpay.dto.MerchantPaymentDtos.MerchantWalletPaymentResponse;
import com.flopay.merchantpay.dto.MerchantPaymentDtos.MerchantWalletSummaryResponse;
import com.flopay.merchantpay.dto.MerchantPaymentDtos.PayMerchantRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Wallet-to-merchant payments — a consumer paying a shop's FloPay VPA, as
 * opposed to {@link com.flopay.transfer.TransferService}'s wallet-to-wallet
 * P2P transfers. The money lands in the merchant's SETTLEMENT_PENDING
 * account, not a spendable wallet — the settlement job ({@code SettlementRunner})
 * moves it to SETTLED on its own schedule, same as a real payment processor's
 * payout hold.
 */
@Service
@RequiredArgsConstructor
public class MerchantPaymentService {

    private static final String CURRENCY = "INR";

    private final UserRepository userRepository;
    private final MerchantRepository merchantRepository;
    private final LedgerService ledgerService;
    private final JournalEntryRepository journalEntryRepository;
    private final MerchantWalletPaymentRepository merchantWalletPaymentRepository;

    @Transactional
    public MerchantPaymentResponse pay(Long payerUserId, PayMerchantRequest request) {
        User payer = userRepository.findById(payerUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (payer.isFrozen()) {
            throw ApiException.forbidden("Your account is frozen. Contact support.");
        }

        Merchant merchant = merchantRepository.findByMerchantVpa(request.merchantVpa().trim().toLowerCase())
                .orElseThrow(() -> ApiException.badRequest("No FloPay merchant with that VPA"));

        boolean isReplay = journalEntryRepository.findByIdempotencyKey(request.idempotencyKey()).isPresent();

        Account payerWallet = ledgerService.getAccount(AccountOwnerType.USER, payerUserId, AccountKind.WALLET, CURRENCY);
        Account merchantPending = ledgerService.getOrOpenAccount(
                AccountOwnerType.MERCHANT, merchant.getId(), AccountKind.SETTLEMENT_PENDING, CURRENCY);

        JournalEntry entry = ledgerService.post(
                request.idempotencyKey(), "WALLET_MERCHANT_PAYMENT", merchant.getId().toString(), request.note(),
                List.of(
                        PostingLine.debit(payerWallet.getId(), request.amountMinor()),
                        PostingLine.credit(merchantPending.getId(), request.amountMinor())));

        if (!isReplay) {
            merchantWalletPaymentRepository.save(MerchantWalletPayment.builder()
                    .merchantId(merchant.getId())
                    .payerUserId(payerUserId)
                    .payerVpaSnapshot(payer.getVpa())
                    .payerDisplayNameSnapshot(payer.getDisplayName())
                    .amountMinor(request.amountMinor())
                    .note(request.note())
                    .entryId(entry.getId())
                    .build());
        }

        return new MerchantPaymentResponse(
                entry.getId().toString(), merchant.getName(), request.amountMinor(), request.note(), entry.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<MerchantWalletPaymentResponse> listForMerchant(Long merchantId) {
        return merchantWalletPaymentRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(p -> new MerchantWalletPaymentResponse(
                        p.getId().toString(), p.getPayerVpaSnapshot(), p.getPayerDisplayNameSnapshot(),
                        p.getAmountMinor(), p.getNote(), p.getCreatedAt()))
                .toList();
    }

    /**
     * Read-only, so it must never lazily open an account (that's a write —
     * a merchant who has never been paid has no SETTLEMENT_PENDING/SETTLED
     * row yet, and checking a balance shouldn't be what creates one).
     */
    @Transactional(readOnly = true)
    public MerchantWalletSummaryResponse summary(Long merchantId) {
        long pending = balanceOrZero(merchantId, AccountKind.SETTLEMENT_PENDING);
        long settled = balanceOrZero(merchantId, AccountKind.SETTLED);
        List<MerchantWalletPayment> payments = merchantWalletPaymentRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        long total = payments.stream().mapToLong(MerchantWalletPayment::getAmountMinor).sum();
        return new MerchantWalletSummaryResponse(pending, settled, total, payments.size());
    }

    private long balanceOrZero(Long merchantId, AccountKind kind) {
        try {
            return ledgerService.getAccount(AccountOwnerType.MERCHANT, merchantId, kind, CURRENCY).getBalanceMinor();
        } catch (ApiException notFound) {
            return 0L;
        }
    }
}
