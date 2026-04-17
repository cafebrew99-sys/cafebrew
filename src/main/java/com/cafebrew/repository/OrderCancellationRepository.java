package com.cafebrew.repository;

import com.cafebrew.model.OrderCancellation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderCancellationRepository extends JpaRepository<OrderCancellation, Long> {
}
