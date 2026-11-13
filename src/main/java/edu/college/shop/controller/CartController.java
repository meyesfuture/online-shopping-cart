package edu.college.shop.controller;
import edu.college.shop.model.Cart; import edu.college.shop.service.CartService;
import java.util.Map; import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/customers/{customerId}/cart") public class CartController {
    private final CartService service; public CartController(CartService service){this.service=service;}
    @GetMapping public Cart view(@PathVariable long customerId){return service.view(customerId);}
    @PostMapping("/items") public Cart add(@PathVariable long customerId,@RequestBody Map<String,Long> body){Long productId=body.get("productId"),quantity=body.get("quantity");if(productId==null||quantity==null||quantity>Integer.MAX_VALUE)throw new IllegalArgumentException("productId and quantity are required");return service.add(customerId,productId,quantity.intValue());}
    @PutMapping("/items/{productId}") public Cart quantity(@PathVariable long customerId,@PathVariable long productId,@RequestBody Map<String,Integer> body){Integer quantity=body.get("quantity");if(quantity==null)throw new IllegalArgumentException("quantity is required");return service.quantity(customerId,productId,quantity);}
    @DeleteMapping("/items/{productId}") public Cart remove(@PathVariable long customerId,@PathVariable long productId){return service.remove(customerId,productId);}
}
