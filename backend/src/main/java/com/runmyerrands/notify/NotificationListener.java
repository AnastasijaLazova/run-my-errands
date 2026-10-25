package com.runmyerrands.notify;

import com.runmyerrands.booking.Booking;
import com.runmyerrands.booking.BookingRepository;
import com.runmyerrands.booking.BookingStatusChanged;
import com.runmyerrands.favor.Favor;
import com.runmyerrands.favor.FavorRepository;
import com.runmyerrands.offer.Offer;
import com.runmyerrands.offer.OfferRepository;
import com.runmyerrands.offer.OfferStatusChanged;
import com.runmyerrands.review.Review;
import com.runmyerrands.review.ReviewPublished;
import com.runmyerrands.review.ReviewRepository;
import com.runmyerrands.user.User;
import com.runmyerrands.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import static com.runmyerrands.notify.Notification.Type.*;

/**
 * Turns domain events into notifications: decides who hears about what. Runs synchronously in the publishing
 * transaction, so a notification exists only if the change it describes was committed.
 */
@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationService notificationService;
    private final BookingRepository bookingRepository;
    private final OfferRepository offerRepository;
    private final FavorRepository favorRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @EventListener
    public void on(BookingStatusChanged event) {
        Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
        if (b == null) return;
        switch (b.getStatus()) {
            case REQUESTED -> notify(b.getGiverId(), BOOKING_REQUESTED, b, b.getRequesterId());
            // An offer-born booking starts CONFIRMED; that one is announced as OFFER_ACCEPTED instead.
            case CONFIRMED -> { if (b.getOrigin() == Booking.Origin.DIRECT_REQUEST) notify(b.getRequesterId(), BOOKING_ACCEPTED, b, b.getGiverId()); }
            case DECLINED -> notify(b.getRequesterId(), BOOKING_DECLINED, b, b.getGiverId());
            case COMPLETED -> notify(b.getRequesterId(), BOOKING_COMPLETED, b, b.getGiverId());
            case EXPIRED -> notify(b.getRequesterId(), BOOKING_EXPIRED, b, b.getGiverId());
            case CANCELLED -> {
                boolean byRequester = b.getRequesterId().equals(event.actorId());
                notify(byRequester ? b.getGiverId() : b.getRequesterId(), BOOKING_CANCELLED, b,
                        byRequester ? b.getRequesterId() : b.getGiverId());
            }
            case CLOSED -> { /* nothing to tell anyone */ }
        }
    }

    @EventListener
    public void on(OfferStatusChanged event) {
        Offer o = offerRepository.findById(event.offerId()).orElse(null);
        if (o == null) return;
        Favor favor = favorRepository.findById(o.getFavorId()).orElse(null);
        if (favor == null) return;
        switch (o.getStatus()) {
            case PENDING -> save(favor.getRequesterId(), OFFER_RECEIVED, null, o.getId(), favor, o.getGiverId());
            case ACCEPTED -> save(o.getGiverId(), OFFER_ACCEPTED,
                    bookingRepository.findByOfferId(o.getId()).map(Booking::getId).orElse(null), o.getId(), favor, favor.getRequesterId());
            case REJECTED -> save(o.getGiverId(), OFFER_REJECTED, null, o.getId(), favor, favor.getRequesterId());
            case WITHDRAWN, EXPIRED -> { /* withdrawals are the giver's own doing; expiry is bulk and silent */ }
        }
    }

    @EventListener
    public void on(ReviewPublished event) {
        Review r = reviewRepository.findById(event.reviewId()).orElse(null);
        if (r == null) return;
        bookingRepository.findById(r.getBookingId())
                .ifPresent(b -> notify(r.getTargetId(), REVIEW_RECEIVED, b, r.getAuthorId()));
    }

    private void notify(Long recipientId, Notification.Type type, Booking b, Long actorId) {
        save(recipientId, type, b.getId(), b.getOfferId(), favorRepository.findById(b.getFavorId()).orElse(null), actorId);
    }

    private void save(Long recipientId, Notification.Type type, Long bookingId, Long offerId, Favor favor, Long actorId) {
        Notification n = new Notification();
        n.setUserId(recipientId);
        n.setType(type);
        n.setBookingId(bookingId);
        n.setOfferId(offerId);
        if (favor != null) {
            n.setFavorId(favor.getId());
            n.setFavorTitle(favor.getTitle());
        }
        if (actorId != null) n.setActorName(userRepository.findById(actorId).map(User::getDisplayName).orElse(null));
        notificationService.create(n);
    }
}
