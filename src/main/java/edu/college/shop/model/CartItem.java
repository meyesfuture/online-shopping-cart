package edu.college.shop.model;

import java.math.BigDecimal;

public class CartItem {
    private final long productId; private final String productName; private final BigDecimal price; private final int quantity; private final int availableStock;
    public CartItem(long productId,String productName,BigDecimal price,int quantity,int availableStock){this.productId=productId;this.productName=productName;this.price=price;this.quantity=quantity;this.availableStock=availableStock;}
    public long getProductId(){return productId;} public String getProductName(){return productName;} public BigDecimal getPrice(){return price;}
    public int getQuantity(){return quantity;} public int getAvailableStock(){return availableStock;}
    public BigDecimal getLineTotal(){return price.multiply(BigDecimal.valueOf(quantity));}
}
