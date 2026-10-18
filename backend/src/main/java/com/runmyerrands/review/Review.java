package com.runmyerrands.review;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "reviews")
@Getter @Setter @NoArgsConstructor
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;
    @Column(name = "author_id", nullable = false)
    private Long authorId;
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false)
    private Short stars;
    private String text;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt = Instant.now();
    @Column(name = "published_at")
    private Instant publishedAt;
}
