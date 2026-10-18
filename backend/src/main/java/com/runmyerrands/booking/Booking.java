package com.runmyerrands.booking;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bookings")
@Getter @Setter @NoArgsConstructor
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "favor_id", nullable = false)
    private Long favorId;
    @Column(name = "requester_id", nullable = false)
    private Long requesterId;
    @Column(name = "giver_id", nullable = false)
    private Long giverId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Origin origin;

    @Column(name = "offer_id")
    private Long offerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.REQUESTED;

    private String note;

    /** Agreed price: the accepted offer's price, or the giver's listed price for a direct booking. */
    private BigDecimal price;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt = Instant.now();
    @Column(name = "responded_at")
    private Instant respondedAt;
    @Column(name = "completed_at")
    private Instant completedAt;
    @Column(name = "cancel_reason")
    private String cancelReason;

    @Version
    private Long version;

    public enum Origin { DIRECT_REQUEST, GIVER_OFFER }
    public enum Status { REQUESTED, CONFIRMED, DECLINED, CANCELLED, EXPIRED, COMPLETED, CLOSED }
}
