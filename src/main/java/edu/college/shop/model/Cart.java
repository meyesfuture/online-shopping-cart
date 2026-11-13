package edu.college.shop.model;

import java.math.BigDecimal; import java.util.List;

public class Cart {
    private final long customerId; private final List<CartItem> items;
    public Cart(long customerId,List<CartItem> items){this.customerId=customerId;this.items=List.copyOf(items);}
    public long getCustomerId(){return customerId;} public List<CartItem> getItems(){return items;}
    public BigDecimal getSubtotal(){return items.stream().map(CartItem::getLineTotal).reduce(BigDecimal.ZERO,BigDecimal::add);}
}
