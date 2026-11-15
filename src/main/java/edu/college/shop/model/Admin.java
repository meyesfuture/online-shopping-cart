package edu.college.shop.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Admin extends Person {
    private final String username;
    private final String email;
    @JsonIgnore
    private final String password;

    public Admin(long id, String name, String username, String email, String password) {
        super(id, name);
        this.username = username;
        this.email = email;
        this.password = password != null && !password.isEmpty() ? password : "admin123";
    }

    public Admin(long id, String name, String email) {
        this(id, name, "admin", email, "admin123");
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    @Override
    public String getRole() {
        return "ADMIN";
    }
}
