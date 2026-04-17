package com.cafebrew.controller;

import com.cafebrew.model.Category;
import com.cafebrew.model.Order;
import com.cafebrew.model.Product;
import com.cafebrew.repository.CategoryRepository;
import com.cafebrew.repository.OrderRepository;
import com.cafebrew.repository.ProductRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CategoryRepository categoryRepository;
    private final com.cafebrew.repository.OrderCancellationRepository orderCancellationRepository;

    // ===== CATEGORY ENDPOINTS =====

    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping("/categories")
    public ResponseEntity<?> addCategory(@RequestBody Category category) {
        if (categoryRepository.findByName(category.getName()).isPresent()) {
            return ResponseEntity.badRequest().body("Category already exists!");
        }
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category details) {
        return categoryRepository.findById(id).map(cat -> {
            cat.setName(details.getName());
            cat.setDescription(details.getDescription());
            cat.setIcon(details.getIcon());
            return ResponseEntity.ok((Object) categoryRepository.save(cat));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        if (!productRepository.findByCategoryId(id).isEmpty()) {
            return ResponseEntity.badRequest().body("Cannot delete: Category has existing products.");
        }
        return categoryRepository.findById(id).map(cat -> {
            categoryRepository.delete(cat);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ===== PRODUCT ENDPOINTS =====

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping("/products")
    public ResponseEntity<?> addProduct(@RequestBody ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElse(null);
        if (category == null) return ResponseEntity.badRequest().body("Invalid category ID");

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(BigDecimal.valueOf(request.getPrice()))
                .category(category)
                .imageUrl(request.getImageUrl() != null && !request.getImageUrl().isEmpty() ? request.getImageUrl() : "/images/placeholder.jpg")
                .build();
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        if (category == null) return ResponseEntity.badRequest().body("Invalid category ID");

        return productRepository.findById(id).map(product -> {
            product.setName(request.getName());
            product.setDescription(request.getDescription());
            product.setPrice(BigDecimal.valueOf(request.getPrice()));
            product.setCategory(category);
            if (request.getImageUrl() != null && !request.getImageUrl().isEmpty()) {
                product.setImageUrl(request.getImageUrl());
            }
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id).map(product -> {
            productRepository.delete(product);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ===== ORDER ENDPOINTS =====

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody StatusRequest statusReq) {
        return orderRepository.findById(id).map(order -> {
            if (order.getStatus() == Order.OrderStatus.DELIVERED) {
                return ResponseEntity.badRequest().body("Order is already DELIVERED and cannot be modified.");
            }
            order.setStatus(Order.OrderStatus.valueOf(statusReq.getStatus()));
            return ResponseEntity.ok((Object) orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/orders/{id}/cancel")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @RequestBody com.cafebrew.controller.dto.CancellationRequest request) {
        return orderRepository.findById(id).map(order -> {
            if (order.getStatus() == Order.OrderStatus.OUT_FOR_DELIVERY || order.getStatus() == Order.OrderStatus.DELIVERED) {
                return ResponseEntity.badRequest().body("Order is too far along to cancel.");
            }
            if (order.getStatus() == Order.OrderStatus.CANCELLED) {
                return ResponseEntity.badRequest().body("Order is already cancelled.");
            }

            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);

            com.cafebrew.model.OrderCancellation cancellation = com.cafebrew.model.OrderCancellation.builder()
                    .order(order)
                    .cancelledBy(com.cafebrew.model.OrderCancellation.CancelledBy.ADMIN)
                    .reason(request.getReason())
                    .customReason(request.getCustomReason())
                    .cancelledAt(java.time.LocalDateTime.now())
                    .build();
            orderCancellationRepository.save(cancellation);

            return ResponseEntity.ok((Object) order);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ===== DTOs =====

    @Data
    static class ProductRequest {
        private String name;
        private String description;
        private double price;
        private Long categoryId;
        private String imageUrl;
    }

    @Data
    static class StatusRequest {
        private String status;
    }
}
