package com.runmyerrands.booking;

import com.runmyerrands.offer.Offer;
import com.runmyerrands.offer.OfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Time-based transitions:
 *   REQUESTED bookings expire after 24 h without an answer (favor goes back to OPEN),
 *   PENDING offers expire after 48 h,
 *   COMPLETED bookings close 7 days after completion (the review window).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingLifecycleJob {

    static final Duration REQUEST_TTL = Duration.ofHours(24);
    static final Duration OFFER_TTL = Duration.ofHours(48);
    static final Duration REVIEW_WINDOW = Duration.ofDays(7);

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final OfferRepository offerRepository;

    @Scheduled(cron = "0 */15 * * * *") // every 15 minutes
    public void expireStaleRequests() {
        Instant cutoff = Instant.now().minus(REQUEST_TTL);
        for (Booking b : bookingRepository.findByStatusAndRequestedAtBefore(Booking.Status.REQUESTED, cutoff)) {
            // One booking per transaction; a giver accepting at the same moment wins via the @Version check.
            try {
                bookingService.expire(b.getId());
            } catch (RuntimeException e) {
                log.warn("Could not expire booking {}: {}", b.getId(), e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void expireStaleOffers() {
        int n = offerRepository.updateStatusCreatedBefore(Instant.now().minus(OFFER_TTL),
                Offer.Status.PENDING, Offer.Status.EXPIRED);
        if (n > 0) log.info("Expired {} stale offers", n);
    }

    @Scheduled(cron = "0 0 * * * *") // hourly
    public void closeFinishedBookings() {
        Instant cutoff = Instant.now().minus(REVIEW_WINDOW);
        for (Booking b : bookingRepository.findByStatusAndCompletedAtBefore(Booking.Status.COMPLETED, cutoff)) {
            try {
                bookingService.closeIfCompleted(b.getId());
            } catch (RuntimeException e) {
                log.warn("Could not close booking {}: {}", b.getId(), e.getMessage());
            }
        }
    }
}
