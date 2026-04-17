package com.cafebrew.controller;

import com.cafebrew.model.Order;
import com.cafebrew.model.OrderItem;
import com.cafebrew.model.Product;
import com.cafebrew.model.User;
import com.cafebrew.repository.OrderRepository;
import com.cafebrew.repository.ProductRepository;
import com.cafebrew.repository.UserRepository;

import lombok.Data;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @PostMapping("/submit")
    public ResponseEntity<?> submitOrder(Authentication authentication, @RequestBody CheckoutRequest request) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();

        Order order = Order.builder()
                .user(user)
                .totalAmount(calculateTotal(request.getItems()))
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .shippingAddress(request.getShippingAddress())
                .orderDate(LocalDateTime.now())
                .build();

        for (CartItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId()).orElseThrow();
            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .user(user)
                    .build();
            order.addItem(orderItem);
        }

        orderRepository.save(order);
        return ResponseEntity.ok("Order Placed Successfully!");
    }

    private BigDecimal calculateTotal(List<CartItemRequest> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (CartItemRequest itemReq : items) {
            Product product = productRepository.findById(itemReq.getProductId()).orElseThrow();
            total = total.add(product.getPrice().multiply(new BigDecimal(itemReq.getQuantity())));
        }
        return total;
    }

    @Data
    static class CheckoutRequest {
        private String shippingAddress;
        private String paymentMethod; // COD
        private List<CartItemRequest> items;
    }

    @Data
    static class CartItemRequest {
        private Long productId;
        private Integer quantity;
    }


}
