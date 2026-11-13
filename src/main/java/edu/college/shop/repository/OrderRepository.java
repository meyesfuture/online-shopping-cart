package edu.college.shop.repository;
import edu.college.shop.model.Order; import edu.college.shop.model.OrderItem;
import java.util.List; import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.stereotype.Repository;
@Repository public class OrderRepository {
    private final JdbcTemplate jdbc; public OrderRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}
    public long create(long customerId,java.math.BigDecimal subtotal,java.math.BigDecimal percent,java.math.BigDecimal discount,java.math.BigDecimal total){jdbc.update("INSERT INTO orders(customer_id,subtotal,discount_percent,discount_amount,total) VALUES(?,?,?,?,?)",customerId,subtotal,percent,discount,total);return jdbc.queryForObject("SELECT LAST_INSERT_ID()",Long.class);}
    public void addItem(long orderId,OrderItem i){jdbc.update("INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES(?,?,?,?,?,?)",orderId,i.getProductId(),i.getProductName(),i.getUnitPrice(),i.getQuantity(),i.getLineTotal());}
    public List<Order> findForCustomer(long customerId){
        List<Order> headers=jdbc.query("SELECT * FROM orders WHERE customer_id=? ORDER BY created_at DESC,id DESC",(rs,row)->new Order(rs.getLong("id"),rs.getLong("customer_id"),rs.getBigDecimal("subtotal"),rs.getBigDecimal("discount_percent"),rs.getBigDecimal("discount_amount"),rs.getBigDecimal("total"),rs.getString("status"),rs.getTimestamp("created_at").toLocalDateTime(),List.of()),customerId);
        return headers.stream().map(order->new Order(order.getId(),order.getCustomerId(),order.getSubtotal(),order.getDiscountPercent(),order.getDiscountAmount(),order.getTotal(),order.getStatus(),order.getCreatedAt(),findItems(order.getId()))).toList();
    }
    public Order findOne(long id){
        List<Order> found=jdbc.query("SELECT * FROM orders WHERE id=?",(rs,row)->new Order(rs.getLong("id"),rs.getLong("customer_id"),rs.getBigDecimal("subtotal"),rs.getBigDecimal("discount_percent"),rs.getBigDecimal("discount_amount"),rs.getBigDecimal("total"),rs.getString("status"),rs.getTimestamp("created_at").toLocalDateTime(),List.of()),id);
        if(found.isEmpty())return null;Order header=found.get(0);
        return new Order(header.getId(),header.getCustomerId(),header.getSubtotal(),header.getDiscountPercent(),header.getDiscountAmount(),header.getTotal(),header.getStatus(),header.getCreatedAt(),findItems(id));
    }
    public List<OrderItem> findItems(long id){return jdbc.query("SELECT * FROM order_items WHERE order_id=? ORDER BY id",(rs,row)->new OrderItem(rs.getLong("product_id"),rs.getString("product_name"),rs.getBigDecimal("unit_price"),rs.getInt("quantity"),rs.getBigDecimal("line_total")),id);}
}
