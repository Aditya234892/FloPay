package com.flopay.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(errorBody(ex.getStatus().name(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody("BAD_REQUEST", message));
    }

    /**
     * Without this, an unhandled exception propagates past Spring MVC and
     * gets re-dispatched to the servlet container's /error path — which the
     * security filter chain then rejects as unauthenticated, surfacing as a
     * misleading 401 "session expired" instead of the real 500. Found via
     * exactly that failure mode (a read-only-transaction violation showing
     * up as a bogus auth error).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody("INTERNAL_ERROR", "Something went wrong. Please try again."));
    }

    private Map<String, Object> errorBody(String code, String description) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", Map.of("code", code, "description", description));
        return body;
    }
}
