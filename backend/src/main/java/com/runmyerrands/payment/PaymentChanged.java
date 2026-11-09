package com.runmyerrands.payment;

/** Published (inside the transaction) when a payment is made or settled. */
public record PaymentChanged(Long paymentId) {}
