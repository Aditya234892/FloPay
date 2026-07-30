package com.flopay.order.dto;

import com.flopay.order.Order;
import com.flopay.order.OrderStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class OrderDtos {

    private OrderDtos() {
    }

    public record CreateOrderRequest(
            @NotNull @Min(100) Long amount,
            String currency,
            String receipt
    ) {
    }

    public record OrderResponse(
            String id,
            Long amount,
            String currency,
            String receipt,
            OrderStatus status,
            Instant createdAt
    ) {
        public static OrderResponse from(Order order) {
            return new OrderResponse(
                    order.getId(), order.getAmount(), order.getCurrency(),
                    order.getReceipt(), order.getStatus(), order.getCreatedAt()
            );
        }
    }
}
