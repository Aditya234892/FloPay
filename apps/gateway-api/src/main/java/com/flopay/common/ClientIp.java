package com.flopay.common;

import jakarta.servlet.http.HttpServletRequest;

/** Render (and most PaaS) sit behind a proxy, so request.getRemoteAddr() alone is the load balancer's own IP. */
public final class ClientIp {

    private ClientIp() {
    }

    public static String of(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
