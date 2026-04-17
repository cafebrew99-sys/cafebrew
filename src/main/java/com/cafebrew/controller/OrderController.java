package com.cafebrew.controller;

import com.cafebrew.model.Order;
import com.cafebrew.model.User;
import com.cafebrew.repository.OrderRepository;
import com.cafebrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final com.cafebrew.repository.OrderCancellationRepository orderCancellationRepository;

    @GetMapping("/my-orders")
    public List<Order> getMyOrders(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        return orderRepository.findByUserOrderByOrderDateDesc(user);
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/cancel")
    @org.springframework.transaction.annotation.Transactional
    public org.springframework.http.ResponseEntity<?> cancelOrder(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody com.cafebrew.controller.dto.CancellationRequest request,
            Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        return orderRepository.findById(id).map(order -> {
            if (!order.getUser().getId().equals(user.getId())) {
                return org.springframework.http.ResponseEntity.status(403).body("You do not own this order.");
            }
            if (order.getStatus() == Order.OrderStatus.OUT_FOR_DELIVERY || order.getStatus() == Order.OrderStatus.DELIVERED) {
                return org.springframework.http.ResponseEntity.badRequest().body("Order is too far along to cancel.");
            }
            if (order.getStatus() == Order.OrderStatus.CANCELLED) {
                return org.springframework.http.ResponseEntity.badRequest().body("Order is already cancelled.");
            }

            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);

            com.cafebrew.model.OrderCancellation cancellation = com.cafebrew.model.OrderCancellation.builder()
                    .order(order)
                    .cancelledBy(com.cafebrew.model.OrderCancellation.CancelledBy.CUSTOMER)
                    .reason(request.getReason())
                    .customReason(request.getCustomReason())
                    .cancelledAt(java.time.LocalDateTime.now())
                    .build();
            orderCancellationRepository.save(cancellation);

            return org.springframework.http.ResponseEntity.ok((Object) order);
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }
}
