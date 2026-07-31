package com.flopay.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flopay.common.ClientIp;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window rate limiting, in-memory. There is deliberately no Redis here
 * — this app runs as a single instance (see render.yaml), and a distributed
 * limiter would be solving a problem this deployment doesn't have. The
 * tradeoff this accepts: limits reset on restart and don't share state across
 * instances, which is fine for one instance and wrong the moment there are
 * two — the note for future-us if this ever gets horizontally scaled.
 *
 * <p>Only guards the endpoints that are actually attractive to abuse: OTP
 * request (SMS-cost / enumeration), and merchant login/signup (credential
 * stuffing, account-creation spam). Everything else is left alone.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    public record Rule(String pathPrefix, int maxRequests, long windowMillis) {
    }

    private record Window(AtomicInteger count, long windowStart) {
    }

    private final Rule[] rules;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Limits are constructor-supplied, not hardcoded — {@link com.flopay.config.SecurityConfig}
     * wires much higher ones under the dev profile. A fixed 5-per-minute
     * limit is right for a deployed service and wrong for local development
     * (or a test suite that onboards a dozen users per run), where it would
     * just get in the way rather than guard against anything.
     */
    public RateLimitFilter(Rule[] rules) {
        this.rules = rules;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        Rule matched = null;
        for (Rule rule : rules) {
            if (request.getRequestURI().startsWith(rule.pathPrefix())) {
                matched = rule;
                break;
            }
        }

        if (matched == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = matched.pathPrefix() + "|" + ClientIp.of(request);
        if (isRateLimited(key, matched)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), Map.of(
                    "error", Map.of(
                            "code", "RATE_LIMITED",
                            "description", "Too many requests — try again in a minute.")));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String key, Rule rule) {
        long now = Instant.now().toEpochMilli();
        Window window = windows.computeIfAbsent(key, k -> new Window(new AtomicInteger(0), now));

        synchronized (window) {
            if (now - window.windowStart() > rule.windowMillis()) {
                windows.put(key, new Window(new AtomicInteger(1), now));
                return false;
            }
            return window.count().incrementAndGet() > rule.maxRequests();
        }
    }
}
