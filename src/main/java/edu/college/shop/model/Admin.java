package edu.college.shop.model;

public class Admin extends Person {
    private final String email;

    public Admin(long id, String name, String email) {
        super(id, name);
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public String getRole() {
        return "ADMIN";
    }
}
