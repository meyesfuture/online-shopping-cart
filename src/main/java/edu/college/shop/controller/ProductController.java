package edu.college.shop.controller;

import edu.college.shop.model.Product;
import edu.college.shop.model.ProductRequest;
import edu.college.shop.service.ProductService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    private void verifyAdmin(String role, String token) {
        if (!"ADMIN".equalsIgnoreCase(role) || token == null || !token.startsWith("ADMIN_SESSION_TOKEN_")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied: Only administrators can access store management tools");
        }
    }

    @GetMapping
    public List<Product> list(@RequestParam(required = false) String search) {
        return service.list(search);
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> add(
            @Valid @RequestBody ProductRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        verifyAdmin(role, token);
        long id = service.add(request);
        return ResponseEntity.created(URI.create("/api/products/" + id)).body(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable long id,
            @Valid @RequestBody ProductRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        verifyAdmin(role, token);
        service.update(id, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Void> stock(
            @PathVariable long id,
            @RequestBody Map<String, Integer> body,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        verifyAdmin(role, token);
        Integer stock = body.get("stock");
        if (stock == null) throw new IllegalArgumentException("stock is required");
        service.stock(id, stock);
        return ResponseEntity.noContent().build();
    }
}
