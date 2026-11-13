package edu.college.shop.model;

public class Customer extends Person {
    private final String email;
    private final String phone;
    public Customer(long id, String name, String email, String phone) { super(id, name); this.email = email; this.phone = phone; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    @Override public String getRole() { return "CUSTOMER"; }
}
