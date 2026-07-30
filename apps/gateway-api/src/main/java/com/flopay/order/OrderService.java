package com.flopay.order;

import com.flopay.common.ApiException;
import com.flopay.common.IdGenerator;
import com.flopay.merchant.MerchantRepository;
import com.flopay.order.dto.OrderDtos.CreateOrderRequest;
import com.flopay.order.dto.OrderDtos.OrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final MerchantRepository merchantRepository;

    @Transactional
    public OrderResponse createOrder(Long merchantId, CreateOrderRequest request) {
        Order order = Order.builder()
                .id(IdGenerator.generate("order_"))
                .merchant(merchantRepository.getReferenceById(merchantId))
                .amount(request.amount())
                .currency(request.currency() == null || request.currency().isBlank() ? "INR" : request.currency())
                .receipt(request.receipt())
                .status(OrderStatus.CREATED)
                .build();
        return OrderResponse.from(orderRepository.save(order));
    }

    public OrderResponse getOrder(Long merchantId, String orderId) {
        return OrderResponse.from(findOwned(merchantId, orderId));
    }

    public List<OrderResponse> listOrders(Long merchantId) {
        return orderRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(OrderResponse::from)
                .toList();
    }

    Order findOwned(Long merchantId, String orderId) {
        return orderRepository.findByIdAndMerchantId(orderId, merchantId)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
    }
}
