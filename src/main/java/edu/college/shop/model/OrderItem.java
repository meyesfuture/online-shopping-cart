package edu.college.shop.model;

import java.math.BigDecimal;

public class OrderItem {
    private final long productId; private final String productName; private final BigDecimal unitPrice; private final int quantity; private final BigDecimal lineTotal;
    public OrderItem(long productId,String productName,BigDecimal unitPrice,int quantity,BigDecimal lineTotal){this.productId=productId;this.productName=productName;this.unitPrice=unitPrice;this.quantity=quantity;this.lineTotal=lineTotal;}
    public long getProductId(){return productId;} public String getProductName(){return productName;} public BigDecimal getUnitPrice(){return unitPrice;}
    public int getQuantity(){return quantity;} public BigDecimal getLineTotal(){return lineTotal;}
}
