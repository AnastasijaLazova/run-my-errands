package com.runmyerrands.review;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Publishes any review still hidden 7 days after submission (the blind-review rule). */
@Component
@RequiredArgsConstructor
public class ReviewPublishJob {

    private final ReviewRepository reviewRepository;
    private final ReviewService reviewService;

    @Scheduled(cron = "0 0 * * * *") // hourly
    public void publishStaleReviews() {
        Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        reviewRepository.findByPublishedAtIsNullAndSubmittedAtBefore(cutoff).forEach(reviewService::publish);
    }
}
