package edu.college.shop.service;

import edu.college.shop.model.Customer;
import edu.college.shop.model.CustomerRequest;
import edu.college.shop.repository.CustomerRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {
    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public List<Customer> list() {
        return repository.findAll();
    }

    public Customer get(long id) {
        return repository.findById(id);
    }

    public Optional<Customer> findByEmail(String email) {
        return repository.findByEmail(email);
    }

    public long register(CustomerRequest request) {
        return repository.insert(request);
    }

    public void update(long id, CustomerRequest request) {
        repository.update(id, request);
    }
}
