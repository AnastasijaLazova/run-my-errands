package com.runmyerrands.offer;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "offers")
@Getter @Setter @NoArgsConstructor
public class Offer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "favor_id", nullable = false)
    private Long favorId;
    @Column(name = "giver_id", nullable = false)
    private Long giverId;

    private String message;

    @Column(name = "proposed_price")
    private BigDecimal proposedPrice;
    @Column(name = "proposed_time")
    private Instant proposedTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum Status { PENDING, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED }
}
