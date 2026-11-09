package com.runmyerrands.payment;

import com.runmyerrands.favor.Favor;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class CancellationPolicyTest {

    private static final BigDecimal PRICE = new BigDecimal("500.00");
    private static final BigDecimal FEE = new BigDecimal("50");
    private static final Instant PAID = Instant.parse("2026-11-08T10:00:00Z");

    @Test
    void feeIsTenPercentRoundedToWholeDenars() {
        assertEquals(0, new BigDecimal("50").compareTo(CancellationPolicy.fee(PRICE)));
        assertEquals(0, new BigDecimal("35").compareTo(CancellationPolicy.fee(new BigDecimal("345.00"))));
    }

    @Test
    void asapFavorIsFreeForTenMinutesAfterPaying() {
        Instant freeUntil = CancellationPolicy.freeUntil(PAID, Favor.WhenType.ASAP, null);
        assertEquals(PAID.plus(Duration.ofMinutes(10)), freeUntil);

        var early = CancellationPolicy.onCancel(PRICE, FEE, true, freeUntil, PAID.plus(Duration.ofMinutes(9)));
        assertTrue(early.free());
        assertEquals(0, PRICE.compareTo(early.refund()));
        assertEquals(0, early.giverPayout().signum());
    }

    @Test
    void lateRequesterCancelSplitsThePriceInHalf() {
        Instant freeUntil = CancellationPolicy.freeUntil(PAID, Favor.WhenType.ASAP, null);
        var late = CancellationPolicy.onCancel(PRICE, FEE, true, freeUntil, PAID.plus(Duration.ofMinutes(11)));
        assertFalse(late.free());
        assertEquals(0, new BigDecimal("250").compareTo(late.refund()));
        assertEquals(0, new BigDecimal("250").compareTo(late.giverPayout()));
    }

    @Test
    void scheduledFavorIsFreeUntil24HoursBefore() {
        Instant when = PAID.plus(Duration.ofDays(3));
        Instant freeUntil = CancellationPolicy.freeUntil(PAID, Favor.WhenType.SCHEDULED, when);
        assertEquals(when.minus(Duration.ofHours(24)), freeUntil);

        assertTrue(CancellationPolicy.onCancel(PRICE, FEE, true, freeUntil, when.minus(Duration.ofHours(25))).free());
        assertFalse(CancellationPolicy.onCancel(PRICE, FEE, true, freeUntil, when.minus(Duration.ofHours(23))).free());
    }

    @Test
    void scheduledSoonStillGetsTheTenMinuteWindow() {
        Instant when = PAID.plus(Duration.ofHours(5));
        assertEquals(PAID.plus(Duration.ofMinutes(10)), CancellationPolicy.freeUntil(PAID, Favor.WhenType.SCHEDULED, when));
    }

    @Test
    void giverCancelRefundsEverythingIncludingTheFee() {
        var o = CancellationPolicy.onCancel(PRICE, FEE, false, PAID, PAID.plus(Duration.ofDays(1)));
        assertEquals(0, new BigDecimal("550").compareTo(o.refund()));
        assertEquals(0, o.giverPayout().signum());
    }
}
