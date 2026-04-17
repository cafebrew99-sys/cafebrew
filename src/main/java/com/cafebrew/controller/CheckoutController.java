package com.cafebrew.controller;

import com.cafebrew.model.Order;
import com.cafebrew.model.OrderItem;
import com.cafebrew.model.Product;
import com.cafebrew.model.User;
import com.cafebrew.repository.OrderRepository;
import com.cafebrew.repository.ProductRepository;
import com.cafebrew.repository.UserRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @PostMapping("/create-razorpay-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody CheckoutRequest request) throws RazorpayException {
        BigDecimal totalAmount = calculateTotal(request.getItems());
        
        RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        
        JSONObject orderRequest = new JSONObject();
        // Razorpay accepts amount in subunits (paise for INR)
        orderRequest.put("amount", totalAmount.multiply(new BigDecimal("100")).intValue()); 
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        com.razorpay.Order rzpOrder = razorpay.orders.create(orderRequest);
        return ResponseEntity.ok(new RzpOrderResponse(rzpOrder.get("id").toString(), totalAmount));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitOrder(Authentication authentication, @RequestBody CheckoutRequest request) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();

        Order order = Order.builder()
                .user(user)
                .totalAmount(calculateTotal(request.getItems()))
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .razorpayOrderId(request.getRazorpayOrderId())
                .paymentId(request.getRazorpayPaymentId())
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
        private String paymentMethod; // COD or RAZORPAY
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private List<CartItemRequest> items;
    }

    @Data
    static class CartItemRequest {
        private Long productId;
        private Integer quantity;
    }

    @Data
    @RequiredArgsConstructor
    static class RzpOrderResponse {
        private final String orderId;
        private final BigDecimal amount;
    }
}
