package edu.college.shop.model;
import java.math.BigDecimal;
public interface DiscountPolicy { BigDecimal discountFor(BigDecimal subtotal); BigDecimal percent(); }
