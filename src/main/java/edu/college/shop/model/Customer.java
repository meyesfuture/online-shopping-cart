package edu.college.shop.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Customer extends Person {
    private final String email;
    private final String phone;
    @JsonIgnore
    private final String password;

    public Customer(long id, String name, String email, String phone, String password) {
        super(id, name);
        this.email = email;
        this.phone = phone;
        this.password = password != null && !password.isEmpty() ? password : "student123";
    }

    public Customer(long id, String name, String email, String phone) {
        this(id, name, email, phone, "student123");
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getPassword() {
        return password;
    }

    @Override
    public String getRole() {
        return "CUSTOMER";
    }
}
