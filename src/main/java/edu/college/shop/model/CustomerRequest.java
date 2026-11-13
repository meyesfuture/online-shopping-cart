package edu.college.shop.model;
import jakarta.validation.constraints.*;
public record CustomerRequest(@NotBlank @Size(max=120) String name,@NotBlank @Email @Size(max=180) String email,@Size(max=30) String phone) {}
