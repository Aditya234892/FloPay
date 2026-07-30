package com.flopay.security;

import com.flopay.merchant.ApiKey;
import com.flopay.merchant.ApiKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates payment-API requests carrying "Authorization: Basic base64(key_id:key_secret)",
 * mirroring how real Razorpay integrations authenticate server-to-server calls.
 */
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    public static final String API_KEY_SECRET_ATTR = "flopay.apiKeySecretPlain";

    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;

    public ApiKeyAuthFilter(ApiKeyRepository apiKeyRepository, PasswordEncoder passwordEncoder) {
        this.apiKeyRepository = apiKeyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Basic ")) {
            try {
                String decoded = new String(Base64.getDecoder().decode(header.substring(6)), StandardCharsets.UTF_8);
                int colon = decoded.indexOf(':');
                if (colon > 0) {
                    String keyId = decoded.substring(0, colon);
                    String keySecret = decoded.substring(colon + 1);
                    Optional<ApiKey> apiKey = apiKeyRepository.findByKeyIdAndActiveTrue(keyId);
                    if (apiKey.isPresent() && passwordEncoder.matches(keySecret, apiKey.get().getKeySecretHash())) {
                        Long merchantId = apiKey.get().getMerchant().getId();
                        var principal = new AuthenticatedPrincipal(merchantId, PrincipalType.MERCHANT);
                        var auth = new UsernamePasswordAuthenticationToken(principal, null, List.of());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        // Stashed only for this request's lifetime, to compute payment signatures —
                        // the plaintext secret is never persisted (only its BCrypt hash is stored).
                        request.setAttribute(API_KEY_SECRET_ATTR, keySecret);
                    }
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
