package com.flopay.admin;

import com.flopay.admin.dto.AdminUserDtos.AdminUserResponse;
import com.flopay.audit.AuditLogService;
import com.flopay.common.ApiException;
import com.flopay.common.ClientIp;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final String CURRENCY = "INR";

    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> search(String query) {
        return userRepository.search(query).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AdminUserResponse setFrozen(Long adminId, Long userId, boolean frozen) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        user.setFrozen(frozen);
        AdminUserResponse response = toResponse(userRepository.save(user));
        auditLogService.record(
                "ADMIN", adminId, frozen ? "ADMIN_USER_FROZEN" : "ADMIN_USER_UNFROZEN",
                "user=" + userId, ClientIp.of(httpServletRequest));
        return response;
    }

    private AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(), user.getPhone(), user.getVpa(), user.getDisplayName(), user.isProfileComplete(),
                user.isFrozen(), walletBalanceOrZero(user.getId()), user.getCreatedAt());
    }

    /**
     * Every real signup opens a WALLET account in the same transaction (see
     * ConsumerAuthService#verifyOtp), so this should always exist — but this
     * is a search-results list, and one historical row missing its account
     * (a race, or old test data) must not 404 the entire admin page for
     * every other user too.
     */
    private long walletBalanceOrZero(Long userId) {
        try {
            return ledgerService.getAccount(AccountOwnerType.USER, userId, AccountKind.WALLET, CURRENCY).getBalanceMinor();
        } catch (ApiException notFound) {
            return 0L;
        }
    }
}
