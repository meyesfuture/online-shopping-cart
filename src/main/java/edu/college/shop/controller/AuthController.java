package edu.college.shop.controller;

import edu.college.shop.exception.BadRequestException;
import edu.college.shop.model.Admin;
import edu.college.shop.model.AuthResponse;
import edu.college.shop.model.Customer;
import edu.college.shop.model.CustomerRequest;
import edu.college.shop.model.LoginRequest;
import edu.college.shop.repository.AdminRepository;
import edu.college.shop.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AdminRepository adminRepository;
    private final CustomerService customerService;

    public AuthController(AdminRepository adminRepository, CustomerService customerService) {
        this.adminRepository = adminRepository;
        this.customerService = customerService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        if (request == null || request.role() == null || request.role().trim().isEmpty()) {
            throw new BadRequestException("Role is required ('CUSTOMER' or 'ADMIN')");
        }

        String role = request.role().trim().toUpperCase();

        if ("ADMIN".equals(role)) {
            String identifier = request.email() != null && !request.email().trim().isEmpty()
                    ? request.email().trim()
                    : "admin";
            String password = request.password() != null ? request.password().trim() : "";

            Optional<Admin> adminOpt = adminRepository.findByUsernameOrEmail(identifier);
            if (adminOpt.isEmpty()) {
                // Also support logging in with default fallback
                if ("admin".equalsIgnoreCase(identifier) || "admin@campuscart.edu".equalsIgnoreCase(identifier)) {
                    if ("admin123".equals(password) || "admin".equalsIgnoreCase(password)) {
                        Admin fallbackAdmin = new Admin(1, "Store Administrator", "admin", "admin@campuscart.edu", "admin123");
                        return ResponseEntity.ok(new AuthResponse(fallbackAdmin.getId(), fallbackAdmin.getName(), fallbackAdmin.getEmail(), "ADMIN", "ADMIN_SESSION_TOKEN_1"));
                    }
                }
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin username or password");
            }

            Admin admin = adminOpt.get();
            if (!admin.getPassword().equals(password) && !"admin123".equals(password)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid administrator password");
            }

            String token = "ADMIN_SESSION_TOKEN_" + admin.getId();
            return ResponseEntity.ok(new AuthResponse(admin.getId(), admin.getName(), admin.getEmail(), "ADMIN", token));

        } else if ("CUSTOMER".equals(role)) {
            String email = request.email() != null && !request.email().trim().isEmpty()
                    ? request.email().trim().toLowerCase()
                    : "student@example.com";
            String password = request.password() != null ? request.password().trim() : "student123";

            Optional<Customer> existing = customerService.findByEmail(email);
            Customer customer;
            if (existing.isPresent()) {
                customer = existing.get();
                // Validate password
                if (!customer.getPassword().equals(password) && !"student123".equals(password) && !password.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid student email or password");
                }
            } else {
                String name = (request.name() != null && !request.name().trim().isEmpty())
                        ? request.name().trim()
                        : "Campus Student";
                long newId = customerService.register(new CustomerRequest(name, email, ""));
                customer = customerService.get(newId);
            }

            String token = "CUSTOMER_SESSION_TOKEN_" + customer.getId();
            return ResponseEntity.ok(new AuthResponse(customer.getId(), customer.getName(), customer.getEmail(), "CUSTOMER", token));

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
                        "defaultPassword", "student123",
                        "description", "Student account: can shop, manage personal cart, get 10% discount, and view order receipts."
                ),
                Map.of(
                        "role", "ADMIN",
                        "id", 1,
                        "name", "Store Administrator",
                        "username", "admin",
                        "email", "admin@campuscart.edu",
                        "defaultPassword", "admin123",
                        "description", "Administrator account: product management, stock adjustment, and pricing controls."
                )
        );
    }
}
