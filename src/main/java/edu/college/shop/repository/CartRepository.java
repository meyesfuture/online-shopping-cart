package edu.college.shop.repository;
import edu.college.shop.exception.NotFoundException; import edu.college.shop.model.CartItem;
import java.util.List; import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.stereotype.Repository;
@Repository public class CartRepository {
    private final JdbcTemplate jdbc; public CartRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}
    public long ensureCart(long customerId){jdbc.update("INSERT INTO carts(customer_id) VALUES(?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",customerId);return jdbc.queryForObject("SELECT id FROM carts WHERE customer_id=?",Long.class,customerId);}
    public void lockCart(long cartId){jdbc.queryForObject("SELECT id FROM carts WHERE id=? FOR UPDATE",Long.class,cartId);}
    public List<CartItem> findItems(long cartId){return jdbc.query("SELECT p.id,p.name,p.price,p.stock,ci.quantity FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? ORDER BY p.name",(rs,row)->new CartItem(rs.getLong("id"),rs.getString("name"),rs.getBigDecimal("price"),rs.getInt("quantity"),rs.getInt("stock")),cartId);}
    public void add(long cartId,long productId,int quantity){jdbc.update("INSERT INTO cart_items(cart_id,product_id,quantity) VALUES(?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)",cartId,productId,quantity);}
    public int setQuantity(long cartId,long productId,int quantity){return jdbc.update("UPDATE cart_items SET quantity=? WHERE cart_id=? AND product_id=?",quantity,cartId,productId);}
    public int remove(long cartId,long productId){return jdbc.update("DELETE FROM cart_items WHERE cart_id=? AND product_id=?",cartId,productId);}
    public void clear(long cartId){jdbc.update("DELETE FROM cart_items WHERE cart_id=?",cartId);}
    public void requireCustomer(long customerId){Integer n=jdbc.queryForObject("SELECT COUNT(*) FROM customers WHERE id=?",Integer.class,customerId);if(n==null||n==0)throw new NotFoundException("Customer not found: "+customerId);}
    public void requireCartItem(long cartId,long productId){Integer n=jdbc.queryForObject("SELECT COUNT(*) FROM cart_items WHERE cart_id=? AND product_id=?",Integer.class,cartId,productId);if(n==null||n==0)throw new NotFoundException("Product is not in this cart");}
}
