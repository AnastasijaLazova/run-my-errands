package com.runmyerrands.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBookingId(Long bookingId);
    Optional<Review> findByBookingIdAndAuthorId(Long bookingId, Long authorId);
    List<Review> findByPublishedAtIsNullAndSubmittedAtBefore(Instant cutoff);
    List<Review> findByTargetIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(Long targetId);
}
