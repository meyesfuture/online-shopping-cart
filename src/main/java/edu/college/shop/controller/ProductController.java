package edu.college.shop.controller;
import edu.college.shop.model.Product; import edu.college.shop.model.ProductRequest; import edu.college.shop.service.ProductService;
import jakarta.validation.Valid; import java.net.URI; import java.util.List; import java.util.Map;
import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/products") public class ProductController {
    private final ProductService service; public ProductController(ProductService service){this.service=service;}
    @GetMapping public List<Product> list(@RequestParam(required=false) String search){return service.list(search);}
    @GetMapping("/{id}") public Product get(@PathVariable long id){return service.get(id);}
    @PostMapping public ResponseEntity<Map<String,Long>> add(@Valid @RequestBody ProductRequest request){long id=service.add(request);return ResponseEntity.created(URI.create("/api/products/"+id)).body(Map.of("id",id));}
    @PutMapping("/{id}") public ResponseEntity<Void> update(@PathVariable long id,@Valid @RequestBody ProductRequest request){service.update(id,request);return ResponseEntity.noContent().build();}
    @PatchMapping("/{id}/stock") public ResponseEntity<Void> stock(@PathVariable long id,@RequestBody Map<String,Integer> body){Integer stock=body.get("stock");if(stock==null)throw new IllegalArgumentException("stock is required");service.stock(id,stock);return ResponseEntity.noContent().build();}
}
