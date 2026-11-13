package edu.college.shop.service;
import edu.college.shop.model.Product; import edu.college.shop.model.ProductRequest; import edu.college.shop.repository.ProductRepository;
import java.util.List; import org.springframework.stereotype.Service;
@Service public class ProductService {
    private final ProductRepository repository; public ProductService(ProductRepository repository){this.repository=repository;}
    public List<Product> list(String search){return search==null||search.isBlank()?repository.findAll():repository.search(search.trim());}
    public Product get(long id){return repository.findById(id);} public long add(ProductRequest request){return repository.insert(request);}
    public void update(long id,ProductRequest request){repository.update(id,request);} public void stock(long id,int stock){if(stock<0)throw new IllegalArgumentException("Stock cannot be negative");repository.updateStock(id,stock);}
}
