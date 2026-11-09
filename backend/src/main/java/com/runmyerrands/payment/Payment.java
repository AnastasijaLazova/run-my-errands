package com.runmyerrands.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A simulated payment for one booking. Nothing is charged for real; only the card brand and last four digits
 * are kept, for display. amount is what the giver earns, fee is the platform's cut, total is what was charged.
 */
@Entity
@Table(name = "payments")
@Getter @Setter @NoArgsConstructor
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false, unique = true)
    private Long bookingId;
    @Column(name = "requester_id", nullable = false)
    private Long requesterId;
    @Column(name = "giver_id", nullable = false)
    private Long giverId;

    @Column(nullable = false)
    private BigDecimal amount;
    @Column(nullable = false)
    private BigDecimal fee;
    @Column(nullable = false)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.HELD;

    @Column(name = "card_brand")
    private String cardBrand;
    @Column(name = "card_last4", length = 4)
    @JdbcTypeCode(SqlTypes.CHAR)
    private String cardLast4;

    @Column(name = "paid_at", nullable = false)
    private Instant paidAt = Instant.now();
    /** Set once the money leaves escrow: released on completion, or split up on cancellation. */
    @Column(name = "refund_amount", nullable = false)
    private BigDecimal refundAmount = BigDecimal.ZERO;
    @Column(name = "giver_payout", nullable = false)
    private BigDecimal giverPayout = BigDecimal.ZERO;
    @Column(name = "settled_at")
    private Instant settledAt;

    public enum Status { HELD, RELEASED, REFUNDED, PARTIALLY_REFUNDED }
}
