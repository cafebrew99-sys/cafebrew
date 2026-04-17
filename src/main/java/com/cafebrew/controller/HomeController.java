package com.cafebrew.controller;

import com.cafebrew.model.Category;
import com.cafebrew.model.Product;
import com.cafebrew.repository.CategoryRepository;
import com.cafebrew.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/menu")
    public String menu(Model model) {
        List<Product> products = productRepository.findAll();
        List<Category> categories = categoryRepository.findAll();

        // Group products by Category (preserving seeder order)
        Map<Category, List<Product>> categorizedProducts = new LinkedHashMap<>();
        for (Category cat : categories) {
            List<Product> catProducts = products.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(cat.getId()))
                    .collect(Collectors.toList());
            if (!catProducts.isEmpty()) {
                categorizedProducts.put(cat, catProducts);
            }
        }

        // Collect products with null/orphaned category into a safe "Other" bucket
        // Use an unsaved transient Category (no id) so Hibernate never tries to load it
        List<Product> uncategorized = products.stream()
                .filter(p -> p.getCategory() == null)
                .collect(Collectors.toList());
        if (!uncategorized.isEmpty()) {
            Category other = new Category();
            other.setName("Other");
            other.setIcon("bi-tag-fill");
            // id is null — Hibernate will never try to look this up
            categorizedProducts.put(other, uncategorized);
        }

        model.addAttribute("products", products);
        model.addAttribute("categorizedProducts", categorizedProducts);
        return "menu";
    }

    @GetMapping("/cart")
    public String cart() {
        return "cart";
    }

    @GetMapping("/checkout")
    public String checkout() {
        return "checkout";
    }

    @GetMapping("/my-orders")
    public String myOrders() {
        return "my-orders";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "admin-dashboard";
    }

    @GetMapping("/error")
    public String error() {
        return "error";
    }
}
