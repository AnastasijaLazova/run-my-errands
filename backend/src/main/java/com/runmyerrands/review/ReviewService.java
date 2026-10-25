package com.runmyerrands.review;

import com.runmyerrands.booking.Booking;
import com.runmyerrands.booking.BookingRepository;
import com.runmyerrands.booking.BookingService;
import com.runmyerrands.review.dto.*;
import com.runmyerrands.user.GiverProfileRepository;
import com.runmyerrands.user.User;
import com.runmyerrands.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Optional;

/**
 * Blind two-way reviews: a submitted review stays hidden (publishedAt = null) until the counterpart also
 * submits (both publish immediately) or 7 days pass (ReviewPublishJob).
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final GiverProfileRepository giverProfileRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher events;

    @Transactional
    public ReviewDto submit(Long bookingId, User author, SubmitReviewRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (booking.getStatus() != Booking.Status.COMPLETED && booking.getStatus() != Booking.Status.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Can only review a completed booking");
        }
        Long targetId = counterpart(booking, author.getId());
        if (reviewRepository.findByBookingIdAndAuthorId(bookingId, author.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this booking");
        }

        Review review = new Review();
        review.setBookingId(bookingId);
        review.setAuthorId(author.getId());
        review.setTargetId(targetId);
        review.setStars(request.stars());
        review.setText(request.text());
        try {
            review = reviewRepository.saveAndFlush(review);
        } catch (DataIntegrityViolationException e) {
            // unique (booking_id, author_id): a second submit raced past the check above
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this booking");
        }

        Optional<Review> theirs = reviewRepository.findByBookingIdAndAuthorId(bookingId, targetId);
        if (theirs.isPresent()) {
            publish(review);
            publish(theirs.get());
            bookingService.closeIfCompleted(bookingId); // both sides have had their say
        }
        return ReviewDto.from(review);
    }

    @Transactional(readOnly = true)
    public ReviewStatusDto status(Long bookingId, User user) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        Long otherId = counterpart(booking, user.getId());
        boolean mine = reviewRepository.findByBookingIdAndAuthorId(bookingId, user.getId()).isPresent();
        boolean theirs = reviewRepository.findByBookingIdAndAuthorId(bookingId, otherId).isPresent();
        boolean published = reviewRepository.findByBookingId(bookingId).stream().anyMatch(r -> r.getPublishedAt() != null);
        return new ReviewStatusDto(mine, theirs, published);
    }

    /**
     * Publishes one review and folds the stars into the target's rating for the role they had on this
     * booking: the giver's profile rating, or the requester rating on the user.
     */
    @Transactional
    public void publish(Review review) {
        if (review.getPublishedAt() != null) return;
        review.setPublishedAt(Instant.now());
        reviewRepository.save(review);
        events.publishEvent(new ReviewPublished(review.getId()));

        boolean targetIsGiver = bookingRepository.findById(review.getBookingId())
                .map(b -> b.getGiverId().equals(review.getTargetId())).orElse(false);
        if (targetIsGiver) {
            giverProfileRepository.findByUserId(review.getTargetId()).ifPresent(p -> {
                int newCount = p.getRatingCount() + 1;
                p.setRatingAvg(newAverage(p.getRatingAvg(), p.getRatingCount(), review.getStars()));
                p.setRatingCount(newCount);
                giverProfileRepository.save(p);
            });
        } else {
            userRepository.findById(review.getTargetId()).ifPresent(u -> {
                u.setRequesterRatingAvg(newAverage(u.getRequesterRatingAvg(), u.getRequesterRatingCount(), review.getStars()));
                u.setRequesterRatingCount(u.getRequesterRatingCount() + 1);
                userRepository.save(u);
            });
        }
    }

    private static BigDecimal newAverage(BigDecimal avg, int count, int stars) {
        BigDecimal total = avg.multiply(BigDecimal.valueOf(count)).add(BigDecimal.valueOf(stars));
        return total.divide(BigDecimal.valueOf(count + 1), 2, RoundingMode.HALF_UP);
    }

    private Long counterpart(Booking b, Long userId) {
        if (b.getRequesterId().equals(userId)) return b.getGiverId();
        if (b.getGiverId().equals(userId)) return b.getRequesterId();
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant on this booking");
    }
}
