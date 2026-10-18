package com.runmyerrands.review.dto;

import com.runmyerrands.review.Review;

import java.time.Instant;

public record ReviewDto(Long id, Long bookingId, Long authorId, Long targetId, Short stars, String text,
                        Instant submittedAt) {
    public static ReviewDto from(Review r) {
        return new ReviewDto(r.getId(), r.getBookingId(), r.getAuthorId(), r.getTargetId(), r.getStars(),
                r.getText(), r.getSubmittedAt());
    }
}
