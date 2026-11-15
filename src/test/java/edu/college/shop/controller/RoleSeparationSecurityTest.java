package edu.college.shop.controller;

import edu.college.shop.model.Admin;
import edu.college.shop.model.AuthResponse;
import edu.college.shop.model.Customer;
import edu.college.shop.model.LoginRequest;
import edu.college.shop.model.ProductRequest;
import edu.college.shop.repository.AdminRepository;
import edu.college.shop.service.CustomerService;
import edu.college.shop.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleSeparationSecurityTest {

    @Mock
    private ProductService productService;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private CustomerService customerService;

    private ProductController productController;
    private AuthController authController;

    @BeforeEach
    void setUp() {
        productController = new ProductController(productService);
        authController = new AuthController(adminRepository, customerService);
    }

    @Test
    @DisplayName("Customer cannot add product: backend throws 403 Forbidden")
    void customerCannotAddProduct() {
        ProductRequest req = new ProductRequest("Test Item", "Desc", new BigDecimal("199.00"), 10);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                productController.add(req, "CUSTOMER", "CUSTOMER_SESSION_TOKEN_1")
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Access Denied"));
        verify(productService, never()).add(any());
    }

    @Test
    @DisplayName("Customer cannot modify product stock: backend throws 403 Forbidden")
    void customerCannotModifyStock() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                productController.stock(1L, Map.of("stock", 50), "CUSTOMER", "CUSTOMER_SESSION_TOKEN_1")
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(productService, never()).stock(anyLong(), anyInt());
    }

    @Test
    @DisplayName("Unauthenticated request cannot modify product: backend throws 403 Forbidden")
    void unauthenticatedCannotModifyProduct() {
        ProductRequest req = new ProductRequest("Test Item", "Desc", new BigDecimal("199.00"), 10);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                productController.add(req, null, null)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(productService, never()).add(any());
    }

    @Test
    @DisplayName("Admin with valid token can add product")
    void adminCanAddProduct() {
        ProductRequest req = new ProductRequest("Campus Umbrella", "Windproof", new BigDecimal("299.00"), 20);
        when(productService.add(req)).thenReturn(42L);

        ResponseEntity<Map<String, Long>> res = productController.add(req, "ADMIN", "ADMIN_SESSION_TOKEN_1");

        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(42L, res.getBody().get("id"));
        verify(productService, times(1)).add(req);
    }

    @Test
    @DisplayName("Admin login with valid password returns ADMIN role and token")
    void adminLoginSuccess() {
        Admin admin = new Admin(1, "Store Administrator", "admin", "admin@campuscart.edu", "admin123");
        when(adminRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(admin));

        LoginRequest loginReq = new LoginRequest("admin", "admin123", "ADMIN", null);
        ResponseEntity<AuthResponse> res = authController.login(loginReq);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("ADMIN", res.getBody().role());
        assertEquals("admin@campuscart.edu", res.getBody().email());
        assertEquals("ADMIN_SESSION_TOKEN_1", res.getBody().token());
    }

    @Test
    @DisplayName("Admin login with invalid password throws 401 Unauthorized")
    void adminLoginInvalidPassword() {
        Admin admin = new Admin(1, "Store Administrator", "admin", "admin@campuscart.edu", "admin123");
        when(adminRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(admin));

        LoginRequest loginReq = new LoginRequest("admin", "wrongpassword", "ADMIN", null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authController.login(loginReq)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    @DisplayName("Customer login with valid email returns CUSTOMER role and token")
    void customerLoginSuccess() {
        Customer student = new Customer(1, "Demo Student", "student@example.com", "student123", "9876543210");
        when(customerService.findByEmail("student@example.com")).thenReturn(Optional.of(student));

        LoginRequest loginReq = new LoginRequest("student@example.com", "student123", "CUSTOMER", null);
        ResponseEntity<AuthResponse> res = authController.login(loginReq);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("CUSTOMER", res.getBody().role());
        assertEquals("CUSTOMER_SESSION_TOKEN_1", res.getBody().token());
    }
}
