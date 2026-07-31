package com.flopay.admin;

import com.flopay.admin.dto.AdminUserDtos.AdminUserResponse;
import com.flopay.common.ApiException;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.LedgerService;
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

    @Transactional(readOnly = true)
    public List<AdminUserResponse> search(String query) {
        return userRepository.search(query).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AdminUserResponse setFrozen(Long userId, boolean frozen) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        user.setFrozen(frozen);
        return toResponse(userRepository.save(user));
    }

    private AdminUserResponse toResponse(User user) {
        long balance = ledgerService.getAccount(AccountOwnerType.USER, user.getId(), AccountKind.WALLET, CURRENCY)
                .getBalanceMinor();
        return new AdminUserResponse(
                user.getId(), user.getPhone(), user.getVpa(), user.getDisplayName(), user.isProfileComplete(),
                user.isFrozen(), balance, user.getCreatedAt());
    }
}
