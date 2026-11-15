package edu.college.shop.controller;

import edu.college.shop.exception.BadRequestException;
import edu.college.shop.model.Admin;
import edu.college.shop.model.AuthResponse;
import edu.college.shop.model.Customer;
import edu.college.shop.model.CustomerRequest;
import edu.college.shop.model.LoginRequest;
import edu.college.shop.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String ADMIN_EMAIL = "admin@campuscart.edu";
    private static final String ADMIN_PASSWORD = "admin123";
    private final CustomerService customerService;

    public AuthController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        if (request == null || request.role() == null || request.role().trim().isEmpty()) {
            throw new BadRequestException("Role is required ('CUSTOMER' or 'ADMIN')");
        }

        String role = request.role().trim().toUpperCase();

        if ("ADMIN".equals(role)) {
            String email = request.email() != null && !request.email().trim().isEmpty()
                    ? request.email().trim().toLowerCase()
                    : ADMIN_EMAIL;
            String password = request.password() != null ? request.password().trim() : "";

            // Accept standard admin credentials
            if (ADMIN_PASSWORD.equals(password) || "admin".equalsIgnoreCase(password) || password.isEmpty()) {
                Admin admin = new Admin(0, "Store Administrator", email);
                return ResponseEntity.ok(new AuthResponse(admin.getId(), admin.getName(), admin.getEmail(), admin.getRole()));
            } else {
                throw new BadRequestException("Invalid admin password. Default password is 'admin123'");
            }
        } else if ("CUSTOMER".equals(role)) {
            String email = request.email() != null && !request.email().trim().isEmpty()
                    ? request.email().trim().toLowerCase()
                    : "student@example.com";

            Optional<Customer> existing = customerService.findByEmail(email);
            Customer customer;
            if (existing.isPresent()) {
                customer = existing.get();
            } else {
                String name = (request.name() != null && !request.name().trim().isEmpty())
                        ? request.name().trim()
                        : "Campus Student";
                long newId = customerService.register(new CustomerRequest(name, email, ""));
                customer = customerService.get(newId);
            }
            return ResponseEntity.ok(new AuthResponse(customer.getId(), customer.getName(), customer.getEmail(), customer.getRole()));
        } else {
            throw new BadRequestException("Unsupported role: " + role + ". Expected 'CUSTOMER' or 'ADMIN'");
        }
    }

    @GetMapping("/demo-accounts")
    public List<Map<String, Object>> demoAccounts() {
        return List.of(
                Map.of(
                        "role", "CUSTOMER",
                        "id", 1,
                        "name", "Demo Student",
                        "email", "student@example.com",
                        "description", "Standard student account with personal cart, 10% student discount, and order history"
                ),
                Map.of(
                        "role", "ADMIN",
                        "id", 0,
                        "name", "Store Administrator",
                        "email", ADMIN_EMAIL,
                        "description", "Inventory & product manager with product create, edit, price, and stock controls"
                )
        );
    }
}
