package edu.college.shop.repository;

import edu.college.shop.exception.NotFoundException;
import edu.college.shop.model.Product;
import edu.college.shop.model.ProductRequest;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<Product> mapper = (rs, row) -> {
        String img = "";
        try {
            img = rs.getString("image_url");
            if (img == null) img = "";
        } catch (Exception ignored) {}

        return new Product(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getBigDecimal("price"),
                rs.getInt("stock"),
                img
        );
    };

    public ProductRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Product> findAll() {
        return jdbc.query("SELECT * FROM products ORDER BY id", mapper);
    }

    public List<Product> search(String term) {
        return jdbc.query("SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY id",
                mapper, "%" + term + "%", "%" + term + "%");
    }

    public Product findById(long id) {
        return jdbc.query("SELECT * FROM products WHERE id=?", mapper, id).stream()
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    public long insert(ProductRequest p) {
        String img = p.imageUrl() != null ? p.imageUrl().trim() : "";
        jdbc.update("INSERT INTO products(name, description, price, stock, image_url) VALUES(?,?,?,?,?)",
                p.name().trim(),
                safeDescription(p.description()),
                p.price(),
                p.stock(),
                img);
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    public void update(long id, ProductRequest p) {
        findById(id);
        String img = p.imageUrl() != null ? p.imageUrl().trim() : "";
        jdbc.update("UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?",
                p.name().trim(),
                safeDescription(p.description()),
                p.price(),
                p.stock(),
                img,
                id);
    }

    public void updateStock(long id, int stock) {
        findById(id);
        jdbc.update("UPDATE products SET stock=? WHERE id=?", stock, id);
    }

    private String safeDescription(String value) {
        return value == null ? "" : value;
    }
}
