package edu.college.shop.controller;
import edu.college.shop.model.Customer; import edu.college.shop.model.CustomerRequest; import edu.college.shop.service.CustomerService;
import jakarta.validation.Valid; import java.net.URI; import java.util.List; import java.util.Map;
import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/customers") public class CustomerController {
    private final CustomerService service; public CustomerController(CustomerService service){this.service=service;}
    @GetMapping public List<Customer> list(){return service.list();} @GetMapping("/{id}") public Customer get(@PathVariable long id){return service.get(id);}
    @PostMapping public ResponseEntity<Map<String,Long>> register(@Valid @RequestBody CustomerRequest request){long id=service.register(request);return ResponseEntity.created(URI.create("/api/customers/"+id)).body(Map.of("id",id));}
    @PutMapping("/{id}") public ResponseEntity<Void> update(@PathVariable long id,@Valid @RequestBody CustomerRequest request){service.update(id,request);return ResponseEntity.noContent().build();}
}
