package edu.college.shop.repository;

import edu.college.shop.exception.NotFoundException;
import edu.college.shop.model.Customer;
import edu.college.shop.model.CustomerRequest;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class CustomerRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<Customer> mapper = (rs, row) -> {
        String pwd = "student123";
        try {
            pwd = rs.getString("password");
            if (pwd == null || pwd.isEmpty()) pwd = "student123";
        } catch (Exception ignored) {}

        return new Customer(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("phone"),
                pwd
        );
    };

    public CustomerRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Customer> findAll() {
        return jdbc.query("SELECT * FROM customers ORDER BY id", mapper);
    }

    public Customer findById(long id) {
        return jdbc.query("SELECT * FROM customers WHERE id=?", mapper, id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Customer not found: " + id));
    }

    public Optional<Customer> findByEmail(String email) {
        if (email == null || email.trim().isEmpty()) return Optional.empty();
        return jdbc.query("SELECT * FROM customers WHERE LOWER(email)=LOWER(?)", mapper, email.trim())
                .stream()
                .findFirst();
    }

    public long insert(CustomerRequest c) {
        jdbc.update("INSERT INTO customers(name,email,phone,password) VALUES(?,?,?,'student123')",
                c.name().trim(),
                c.email().trim().toLowerCase(),
                c.phone() == null ? "" : c.phone().trim());
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    public void update(long id, CustomerRequest c) {
        findById(id);
        jdbc.update("UPDATE customers SET name=?,email=?,phone=? WHERE id=?",
                c.name().trim(),
                c.email().trim().toLowerCase(),
                c.phone() == null ? "" : c.phone().trim(),
                id);
    }
}
