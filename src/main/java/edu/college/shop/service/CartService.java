package edu.college.shop.service;
import edu.college.shop.exception.BadRequestException; import edu.college.shop.model.Cart; import edu.college.shop.repository.CartRepository; import edu.college.shop.repository.ProductRepository;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service public class CartService {
    private final CartRepository carts; private final ProductRepository products;
    public CartService(CartRepository carts,ProductRepository products){this.carts=carts;this.products=products;}
    public Cart view(long customerId){long id=cartId(customerId);return new Cart(customerId,carts.findItems(id));}
    @Transactional public Cart add(long customerId,long productId,int quantity){if(quantity<1)throw new BadRequestException("Quantity must be at least 1");carts.requireCustomer(customerId);long cartId=carts.ensureCart(customerId);carts.lockCart(cartId);var product=products.findById(productId);var current=carts.findItems(cartId).stream().filter(i->i.getProductId()==productId).findFirst().map(i->i.getQuantity()).orElse(0);if((long)current+quantity>product.getStock())throw new BadRequestException("Only "+product.getStock()+" units are available");carts.add(cartId,productId,quantity);return view(customerId);}
    @Transactional public Cart quantity(long customerId,long productId,int quantity){if(quantity<1)throw new BadRequestException("Quantity must be at least 1");long id=cartId(customerId);carts.lockCart(id);carts.requireCartItem(id,productId);var product=products.findById(productId);if(quantity>product.getStock())throw new BadRequestException("Only "+product.getStock()+" units are available");carts.setQuantity(id,productId,quantity);return view(customerId);}
    @Transactional public Cart remove(long customerId,long productId){long id=cartId(customerId);carts.lockCart(id);carts.requireCartItem(id,productId);carts.remove(id,productId);return view(customerId);}
    public long cartId(long customerId){carts.requireCustomer(customerId);return carts.ensureCart(customerId);}
}
