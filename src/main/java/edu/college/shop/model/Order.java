package edu.college.shop.model;

import java.math.BigDecimal; import java.time.LocalDateTime; import java.util.List;

public class Order {
    private final long id; private final long customerId; private final BigDecimal subtotal; private final BigDecimal discountPercent;
    private final BigDecimal discountAmount; private final BigDecimal total; private final String status; private final LocalDateTime createdAt; private final List<OrderItem> items;
    public Order(long id,long customerId,BigDecimal subtotal,BigDecimal discountPercent,BigDecimal discountAmount,BigDecimal total,String status,LocalDateTime createdAt,List<OrderItem> items){
        this.id=id;this.customerId=customerId;this.subtotal=subtotal;this.discountPercent=discountPercent;this.discountAmount=discountAmount;this.total=total;this.status=status;this.createdAt=createdAt;this.items=items;
    }
    public long getId(){return id;} public long getCustomerId(){return customerId;} public BigDecimal getSubtotal(){return subtotal;}
    public BigDecimal getDiscountPercent(){return discountPercent;} public BigDecimal getDiscountAmount(){return discountAmount;} public BigDecimal getTotal(){return total;}
    public String getStatus(){return status;} public LocalDateTime getCreatedAt(){return createdAt;} public List<OrderItem> getItems(){return items;}
}
