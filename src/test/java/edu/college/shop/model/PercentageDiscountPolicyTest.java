package edu.college.shop.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PercentageDiscountPolicyTest {
    @Test void calculatesDiscountToTwoDecimalPlaces() {
        PercentageDiscountPolicy policy=new PercentageDiscountPolicy(new BigDecimal("10"));
        assertEquals(new BigDecimal("12.35"),policy.discountFor(new BigDecimal("123.45")));
    }

    @Test void zeroPercentHasNoDiscount() {
        PercentageDiscountPolicy policy=new PercentageDiscountPolicy(BigDecimal.ZERO);
        assertEquals(new BigDecimal("0.00"),policy.discountFor(new BigDecimal("50.00")));
    }
}
