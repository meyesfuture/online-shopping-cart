package edu.college.shop.service;
import edu.college.shop.exception.BadRequestException; import edu.college.shop.exception.NotFoundException; import edu.college.shop.model.*; import edu.college.shop.repository.*;
import java.math.BigDecimal; import java.math.RoundingMode; import java.util.List;
import org.springframework.beans.factory.annotation.Value; import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service public class OrderService {
    private final CartService cartService; private final CartRepository carts; private final OrderRepository orders; private final JdbcTemplate jdbc; private final DiscountPolicy discountPolicy;
    public OrderService(CartService cartService,CartRepository carts,OrderRepository orders,JdbcTemplate jdbc,@Value("${app.discount-percent:10}") BigDecimal percent){
        this.cartService=cartService;this.carts=carts;this.orders=orders;this.jdbc=jdbc;
        if(percent.compareTo(BigDecimal.ZERO)<0||percent.compareTo(BigDecimal.valueOf(100))>0)throw new IllegalArgumentException("Discount must be between 0 and 100");
        this.discountPolicy=new PercentageDiscountPolicy(percent);
    }
    @Transactional public Order checkout(long customerId){
        long cartId=cartService.cartId(customerId);carts.lockCart(cartId);List<CartItem> items=carts.findItems(cartId);if(items.isEmpty())throw new BadRequestException("Your cart is empty");
        // Lock each product and check stock inside this transaction before changing anything.
        for(CartItem item:items){Integer stock=jdbc.queryForObject("SELECT stock FROM products WHERE id=? FOR UPDATE",Integer.class,item.getProductId());if(stock==null||stock<item.getQuantity())throw new BadRequestException("Insufficient stock for "+item.getProductName()+" (available: "+(stock==null?0:stock)+")");}
        BigDecimal subtotal=items.stream().map(CartItem::getLineTotal).reduce(BigDecimal.ZERO,BigDecimal::add).setScale(2,RoundingMode.HALF_UP);
        BigDecimal discount=discountPolicy.discountFor(subtotal);BigDecimal total=subtotal.subtract(discount);
        long orderId=orders.create(customerId,subtotal,discountPolicy.percent(),discount,total);
        for(CartItem item:items){jdbc.update("UPDATE products SET stock=stock-? WHERE id=?",item.getQuantity(),item.getProductId());orders.addItem(orderId,new OrderItem(item.getProductId(),item.getProductName(),item.getPrice(),item.getQuantity(),item.getLineTotal()));}
        carts.clear(cartId);return orders.findOne(orderId);
    }
    public List<Order> history(long customerId){return orders.findForCustomer(customerId);}
    public Order get(long orderId){Order order=orders.findOne(orderId);if(order==null)throw new NotFoundException("Order not found: "+orderId);return order;}
}
