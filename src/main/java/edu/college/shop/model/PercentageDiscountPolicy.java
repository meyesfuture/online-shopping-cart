package edu.college.shop.model;
import java.math.BigDecimal; import java.math.RoundingMode;
public class PercentageDiscountPolicy implements DiscountPolicy {
    private final BigDecimal percentage;
    public PercentageDiscountPolicy(BigDecimal percentage){this.percentage=percentage;}
    @Override public BigDecimal discountFor(BigDecimal subtotal){return subtotal.multiply(percentage).divide(BigDecimal.valueOf(100),2,RoundingMode.HALF_UP);}
    @Override public BigDecimal percent(){return percentage;}
}
