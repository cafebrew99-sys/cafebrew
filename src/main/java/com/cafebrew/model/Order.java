package com.cafebrew.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status;

    @Column(nullable = false)
    private String paymentMethod; // UPI, COD, RAZORPAY

    @Column
    private String razorpayOrderId;

    @Column
    private String paymentId;

    @Column(nullable = false)
    private String shippingAddress;

    @Column(nullable = false)
    private LocalDateTime orderDate;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private OrderCancellation cancellation;

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public enum OrderStatus {
        PENDING, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    }
}
