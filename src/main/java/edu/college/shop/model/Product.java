package edu.college.shop.model;

import java.math.BigDecimal;

public class Product {
    private final long id;
    private final String name;
    private final String description;
    private final BigDecimal price;
    private final int stock;
    public Product(long id, String name, String description, BigDecimal price, int stock) {
        this.id=id; this.name=name; this.description=description; this.price=price; this.stock=stock;
    }
    public Product(String name, BigDecimal price) { this(0, name, "", price, 0); }
    public long getId(){return id;} public String getName(){return name;} public String getDescription(){return description;}
    public BigDecimal getPrice(){return price;} public int getStock(){return stock;}
    public boolean isAvailable(){return stock > 0;}
    @Override public String toString(){return name + " (" + price + ")";}
}
