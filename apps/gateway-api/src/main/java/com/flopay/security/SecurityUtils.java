package com.flopay.security;

import com.flopay.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * Both the API-key filter (payment API) and the JWT filter (dashboard)
     * reach this. Rejects a validly-authenticated USER token just as firmly
     * as no token at all — a merchant id and a user id are both plain Longs
     * and could coincidentally match, so the type is checked here rather than
     * trusted from whichever filter happened to run.
     */
    public static Long currentMerchantId() {
        return currentPrincipal(PrincipalType.MERCHANT).id();
    }

    /** The JWT filter, mounted on the wallet app's routes. */
    public static Long currentUserId() {
        return currentPrincipal(PrincipalType.USER).id();
    }

    /**
     * Rejects with 403 (not 401 — the caller is authenticated, just not
     * privileged) unless the current merchant carries the ADMIN role claim.
     */
    public static Long requireAdminMerchant() {
        AuthenticatedPrincipal principal = currentPrincipal(PrincipalType.MERCHANT);
        if (!"ADMIN".equals(principal.role())) {
            throw ApiException.forbidden("Admin access required");
        }
        return principal.id();
    }

    private static AuthenticatedPrincipal currentPrincipal(PrincipalType required) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (principal.type() != required) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return principal;
    }
}
