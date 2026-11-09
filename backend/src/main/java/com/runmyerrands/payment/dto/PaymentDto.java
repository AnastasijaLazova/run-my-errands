package com.runmyerrands.payment.dto;

import com.runmyerrands.payment.Payment;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A booking's payment, or, before paying, the quote (status UNPAID, card and settlement fields null).
 * freeCancelUntil is only set while the money is held: until then the requester can cancel for a full refund.
 */
public record PaymentDto(Long bookingId, String status, BigDecimal amount, BigDecimal fee, BigDecimal total,
                         String cardBrand, String cardLast4, Instant paidAt, Instant freeCancelUntil,
                         BigDecimal refundAmount, BigDecimal giverPayout, Instant settledAt) {

    public static final String UNPAID = "UNPAID";

    public static PaymentDto quote(Long bookingId, BigDecimal amount, BigDecimal fee) {
        return new PaymentDto(bookingId, UNPAID, amount, fee, amount.add(fee), null, null, null, null, null, null, null);
    }

    public static PaymentDto from(Payment p, Instant freeCancelUntil) {
        return new PaymentDto(p.getBookingId(), p.getStatus().name(), p.getAmount(), p.getFee(), p.getTotal(),
                p.getCardBrand(), p.getCardLast4(), p.getPaidAt(),
                p.getStatus() == Payment.Status.HELD ? freeCancelUntil : null,
                p.getRefundAmount(), p.getGiverPayout(), p.getSettledAt());
    }
}
