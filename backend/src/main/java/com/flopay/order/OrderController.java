package com.flopay.order;

import com.flopay.order.dto.OrderDtos.CreateOrderRequest;
import com.flopay.order.dto.OrderDtos.OrderResponse;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/api/v1/orders")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(SecurityUtils.currentMerchantId(), request));
    }

    @GetMapping("/api/v1/orders/{orderId}")
    public OrderResponse get(@PathVariable String orderId) {
        return orderService.getOrder(SecurityUtils.currentMerchantId(), orderId);
    }

    /** Dashboard-facing (JWT-authenticated) read of a merchant's orders. */
    @GetMapping("/api/dashboard/orders")
    public java.util.List<OrderResponse> listForDashboard() {
        return orderService.listOrders(SecurityUtils.currentMerchantId());
    }
}
