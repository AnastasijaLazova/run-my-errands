package com.runmyerrands.notify;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Recipient. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "booking_id")
    private Long bookingId;
    @Column(name = "offer_id")
    private Long offerId;
    @Column(name = "favor_id")
    private Long favorId;

    /** The other person involved, as named at the time. */
    @Column(name = "actor_name")
    private String actorName;
    @Column(name = "favor_title")
    private String favorTitle;
    /** Money involved, for payment notifications. */
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "read_at")
    private Instant readAt;

    public enum Type {
        BOOKING_REQUESTED,   // -> giver
        BOOKING_ACCEPTED,    // -> requester
        BOOKING_DECLINED,    // -> requester
        BOOKING_CANCELLED,   // -> whoever did not cancel
        BOOKING_COMPLETED,   // -> requester (time to rate)
        BOOKING_EXPIRED,     // -> requester
        OFFER_RECEIVED,      // -> requester
        OFFER_ACCEPTED,      // -> giver
        OFFER_REJECTED,      // -> giver (also when another offer was picked)
        REVIEW_RECEIVED,     // -> review target, once it is published
        PAYMENT_RECEIVED,    // -> giver (money is held until the job is done)
        PAYOUT_RELEASED,     // -> giver (job done, or compensation for a late cancel)
        REFUND_ISSUED        // -> requester
    }
}
