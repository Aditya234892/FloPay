package com.flopay.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Rejects unauthenticated requests with 401 and the same JSON error envelope the rest of the API
 * uses, instead of Spring Security's default bare 403.
 *
 * <p>Deliberately does not send a {@code WWW-Authenticate: Basic} header — that would make browsers
 * pop their native credentials dialog over the demo storefront's XHR calls.
 */
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final String description;

    public JsonAuthenticationEntryPoint(String description) {
        this.description = description;
    }

    @Override
    public void commence(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException authException
    ) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(
                "{\"error\":{\"code\":\"UNAUTHORIZED\",\"description\":\"" + description + "\"}}"
        );
    }
}
