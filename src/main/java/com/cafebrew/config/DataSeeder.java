package com.cafebrew.config;

import com.cafebrew.model.Category;
import com.cafebrew.model.Product;
import com.cafebrew.model.User;
import com.cafebrew.repository.CategoryRepository;
import com.cafebrew.repository.ProductRepository;
import com.cafebrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Fix for "Data truncated for column 'status'"
        try {
            jdbcTemplate.execute("ALTER TABLE orders MODIFY COLUMN status VARCHAR(30)");
            jdbcTemplate.execute("ALTER TABLE order_cancellations MODIFY COLUMN cancelled_by VARCHAR(20)");
        } catch (Exception e) {
            // Table or column might not exist yet if it's the very first run
            System.out.println("Schema update skipped: " + e.getMessage());
        }

        // Seed Admin
        if (userRepository.findByUsername("admin").isEmpty()) {
            userRepository.save(User.builder().username("admin").password("admin").role(User.Role.ADMIN).build());
        }
        // Seed Default Customer
        if (userRepository.findByUsername("customer").isEmpty()) {
            userRepository.save(User.builder().username("customer").password("customer").role(User.Role.USER).build());
        }

        // Seed Categories
        Category hotDrinks   = seedCategory("Hot Drinks",   "Hot beverages to warm your soul",      "bi-cup-hot-fill");
        Category coolDrinks  = seedCategory("Cool Drinks",  "Refreshing chilled beverages",          "bi-cup-straw");
        Category snacks      = seedCategory("Snacks",       "Light bites and savory treats",         "bi-egg-fried");
        Category desserts    = seedCategory("Desserts",     "Sweet indulgences and pastries",         "bi-cake2-fill");
        Category fastFood    = seedCategory("Fast Food",     "Quick and delicious meals",            "bi-fast-forward-fill");

        // Seed Products
        seedProduct("Espresso", "Strong, bold, and pure.", "3.00", hotDrinks);
        seedProduct("Cappuccino", "Espresso with steamed milk foam.", "4.50", hotDrinks);
        seedProduct("Masala Chai", "Authentic Indian spiced tea.", "1.50", hotDrinks);
        seedProduct("Green Tea", "Healthy and refreshing herbal tea.", "2.00", hotDrinks);

        seedProduct("Iced Latte", "Chilled espresso over ice and milk.", "5.00", coolDrinks);
        seedProduct("Mango Smoothie", "Fresh blended mangoes.", "6.00", coolDrinks);
        seedProduct("Classic Cola", "Chilled carbonated soft drink.", "2.50", coolDrinks);
        seedProduct("Lemonade", "Freshly squeezed lemon juice with mint.", "3.00", coolDrinks);

        seedProduct("Veg Puff", "Crispy pastry filled with spiced vegetables.", "2.50", snacks);
        seedProduct("Egg Puff", "Flaky pastry with a spicy boiled egg filling.", "3.00", snacks);
        seedProduct("Avocado Toast", "Smashed avocado on artisan bread.", "7.50", snacks);
        seedProduct("Croissant", "Buttery French pastry.", "3.50", snacks);

        seedProduct("Classic Veg Burger", "Juicy veg patty with fresh veggies and cheese.", "5.50", fastFood);
        seedProduct("Margherita Pizza", "Classic tomato and mozzarella cheese pizza.", "12.00", fastFood);
        seedProduct("French Fries", "Crispy golden potato fries with seasoning.", "4.00", fastFood);

        seedProduct("Tiramisu", "Coffee flavored Italian dessert.", "6.50", desserts);
        seedProduct("Cheesecake", "New York style classic.", "5.50", desserts);
    }

    private void seedProduct(String name, String description, String price, Category category) {
        if (productRepository.findByName(name).isEmpty()) {
            productRepository.save(Product.builder()
                .name(name)
                .description(description)
                .price(new BigDecimal(price))
                .category(category)
                .imageUrl("/images/placeholder.jpg")
                .build());
        }
    }

    private Category seedCategory(String name, String description, String icon) {
        return categoryRepository.findByName(name).orElseGet(() ->
            categoryRepository.save(Category.builder().name(name).description(description).icon(icon).build())
        );
    }
}
