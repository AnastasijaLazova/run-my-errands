package com.runmyerrands.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /** Not used for login — only revealed to the other side once a booking is CONFIRMED. */
    private String phone;

    @Column(name = "display_name", nullable = false)
    private String displayName = "";

    /** Shown publicly instead of a location — Skopje is small enough that the area is all people need. */
    @Column(nullable = false)
    private String neighbourhood = "";

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    private String locale = "en";

    @Column(name = "is_requester", nullable = false)
    private boolean requester = true;

    @Column(name = "is_giver", nullable = false)
    private boolean giver = false;

    /** Rating received as a requester — giver ratings live on GiverProfile. */
    @Column(name = "requester_rating_avg", nullable = false)
    private BigDecimal requesterRatingAvg = BigDecimal.ZERO;

    @Column(name = "requester_rating_count", nullable = false)
    private Integer requesterRatingCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
