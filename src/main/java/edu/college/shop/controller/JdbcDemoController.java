package edu.college.shop.controller;
import edu.college.shop.jdbc.TraditionalJdbcDemo; import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/jdbc-demo") public class JdbcDemoController {
    private final TraditionalJdbcDemo traditional; private final JdbcTemplate jdbc;
    public JdbcDemoController(TraditionalJdbcDemo traditional,JdbcTemplate jdbc){this.traditional=traditional;this.jdbc=jdbc;}
    @GetMapping("/traditional-search") public List<String> traditional(@RequestParam(defaultValue="") String search){return traditional.searchProductNames(search);}
    @GetMapping("/spring-count") public int springCount(){Integer count=jdbc.queryForObject("SELECT COUNT(*) FROM products",Integer.class);return count==null?0:count;}
    @PatchMapping("/traditional-stock") public void traditionalStock(@RequestBody java.util.Map<String,Long> body){Long productId=body.get("productId"),stock=body.get("stock");if(productId==null||stock==null||stock>Integer.MAX_VALUE)throw new IllegalArgumentException("productId and stock are required");traditional.setStock(productId,stock.intValue());}
}
