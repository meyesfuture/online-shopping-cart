package edu.college.shop.repository;

import edu.college.shop.model.Admin;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class AdminRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<Admin> mapper = (rs, row) -> new Admin(
            rs.getLong("id"),
            rs.getString("full_name"),
            rs.getString("username"),
            rs.getString("email"),
            rs.getString("password")
    );

    public AdminRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Admin> findByUsernameOrEmail(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) return Optional.empty();
        String term = identifier.trim().toLowerCase();
        return jdbc.query("SELECT * FROM admins WHERE LOWER(username)=? OR LOWER(email)=?", mapper, term, term)
                .stream()
                .findFirst();
    }
}
