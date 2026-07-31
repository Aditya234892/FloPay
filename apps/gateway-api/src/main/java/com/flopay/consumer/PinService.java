package com.flopay.consumer;

import com.flopay.audit.AuditLogService;
import com.flopay.common.ApiException;
import com.flopay.common.ClientIp;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PinService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final HttpServletRequest httpServletRequest;

    @Transactional(readOnly = true)
    public boolean hasPinSet(Long userId) {
        return requireUser(userId).getPinHash() != null;
    }

    /**
     * Setting or changing a PIN only requires the current session (a valid
     * JWT already proves account ownership) — there's no "confirm your old
     * PIN" step. That's a reasonable simplification for an app-lock PIN, not
     * something that would fly for a transaction-authorizing PIN.
     */
    @Transactional
    public void setPin(Long userId, String pin) {
        User user = requireUser(userId);
        user.setPinHash(passwordEncoder.encode(pin));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public boolean verifyPin(Long userId, String pin) {
        User user = requireUser(userId);
        boolean valid = user.getPinHash() != null && passwordEncoder.matches(pin, user.getPinHash());
        if (!valid) {
            auditLogService.record(
                    "USER", userId, "PIN_VERIFY_FAILED", null, ClientIp.of(httpServletRequest));
        }
        return valid;
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
