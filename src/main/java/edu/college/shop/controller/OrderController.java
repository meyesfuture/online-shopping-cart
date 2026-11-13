package edu.college.shop.controller;
import edu.college.shop.model.Order; import edu.college.shop.service.OrderService; import java.util.List; import java.util.Map;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api") public class OrderController {
    private final OrderService service; public OrderController(OrderService service){this.service=service;}
    @PostMapping("/customers/{customerId}/checkout") public Order checkout(@PathVariable long customerId){return service.checkout(customerId);}
    @GetMapping("/customers/{customerId}/orders") public List<Order> history(@PathVariable long customerId){return service.history(customerId);}
    @GetMapping("/orders/{orderId}") public Order get(@PathVariable long orderId){return service.get(orderId);}
}
