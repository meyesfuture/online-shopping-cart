package edu.college.shop.model;

public record LoginRequest(String email, String password, String role, String name) {}
