package com.cafebrew.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_cancellations")
public class OrderCancellation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CancelledBy cancelledBy;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String customReason;

    @Column(nullable = false)
    private LocalDateTime cancelledAt;

    public enum CancelledBy {
        CUSTOMER, ADMIN
    }
}
