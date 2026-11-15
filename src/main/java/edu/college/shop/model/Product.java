package edu.college.shop.model;

import java.math.BigDecimal;

public class Product {
    private final long id;
    private final String name;
    private final String description;
    private final BigDecimal price;
    private final int stock;
    private final String imageUrl;

    public Product(long id, String name, String description, BigDecimal price, int stock, String imageUrl) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.imageUrl = imageUrl != null ? imageUrl : "";
    }

    public Product(long id, String name, String description, BigDecimal price, int stock) {
        this(id, name, description, price, stock, "");
    }

    public Product(String name, BigDecimal price) {
        this(0, name, "", price, 0, "");
    }

    public long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public int getStock() { return stock; }
    public String getImageUrl() { return imageUrl; }
    public boolean isAvailable() { return stock > 0; }

    @Override
    public String toString() {
        return name + " (" + price + ")";
    }
}
