package com.runmyerrands.booking;

import com.runmyerrands.booking.dto.*;
import com.runmyerrands.favor.Favor;
import com.runmyerrands.favor.FavorRepository;
import com.runmyerrands.offer.Offer;
import com.runmyerrands.offer.OfferRepository;
import com.runmyerrands.review.ReviewRepository;
import com.runmyerrands.user.GiverCategoryRepository;
import com.runmyerrands.user.User;
import com.runmyerrands.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final Set<Booking.Status> CONTACT_VISIBLE =
            Set.of(Booking.Status.CONFIRMED, Booking.Status.COMPLETED, Booking.Status.CLOSED);

    private final BookingRepository bookingRepository;
    private final FavorRepository favorRepository;
    private final UserRepository userRepository;
    private final GiverCategoryRepository giverCategoryRepository;
    private final OfferRepository offerRepository;
    private final ReviewRepository reviewRepository;
    private final ApplicationEventPublisher events;

    /** Path 1: Requester books a Giver directly from Matches. Starts at REQUESTED. */
    @Transactional
    public BookingDto createDirect(User requester, CreateBookingRequest request) {
        Favor favor = favorRepository.findByIdForUpdate(request.favorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favor not found"));
        if (!favor.getRequesterId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your favor");
        }
        if (favor.getStatus() != Favor.Status.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Favor is no longer open");
        }
        if (request.giverId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't book yourself");
        }
        // Only someone who offers this category (and so appears in Matches) can be booked, at their listed price.
        boolean isGiver = userRepository.findById(request.giverId()).map(User::isGiver).orElse(false);
        BigDecimal price = !isGiver ? null : giverCategoryRepository.findByUserId(request.giverId()).stream()
                .filter(gc -> gc.getCategory().getId().equals(favor.getCategory().getId()))
                .map(gc -> gc.getPrice()).findFirst().orElse(null);
        if (price == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This person doesn't offer help in this category");
        }

        Booking booking = new Booking();
        booking.setFavorId(favor.getId());
        booking.setRequesterId(requester.getId());
        booking.setGiverId(request.giverId());
        booking.setOrigin(Booking.Origin.DIRECT_REQUEST);
        booking.setNote(request.note());
        booking.setPrice(price);
        bookingRepository.save(booking);

        favor.setStatus(Favor.Status.BOOKED);
        favorRepository.save(favor);
        // The requester chose someone directly, so pending offers on this favor can no longer be accepted.
        offerRepository.updateStatusForFavor(favor.getId(), Offer.Status.PENDING, Offer.Status.EXPIRED);
        events.publishEvent(new BookingStatusChanged(booking.getId(), requester.getId()));
        return BookingDto.from(booking);
    }

    /** Path 2: created already-CONFIRMED when a Requester accepts a Giver's Offer (see OfferService). */
    @Transactional
    public Booking createFromAcceptedOffer(Long favorId, Long requesterId, Long giverId, Long offerId, BigDecimal price) {
        Booking booking = new Booking();
        booking.setFavorId(favorId);
        booking.setRequesterId(requesterId);
        booking.setGiverId(giverId);
        booking.setOrigin(Booking.Origin.GIVER_OFFER);
        booking.setOfferId(offerId);
        booking.setPrice(price);
        booking.setStatus(Booking.Status.CONFIRMED);
        booking.setRespondedAt(Instant.now());
        return bookingRepository.save(booking);
    }

    @Transactional
    public BookingDto respond(Long bookingId, User actor, BookingStateMachine.Event event, String cancelReason) {
        Booking booking = findOrThrow(bookingId);
        assertParticipant(booking, actor.getId());

        // Role rules: only the Giver can accept/decline a direct request; only the Giver marks it complete.
        boolean isGiver = booking.getGiverId().equals(actor.getId());
        if ((event == BookingStateMachine.Event.ACCEPT || event == BookingStateMachine.Event.DECLINE
                || event == BookingStateMachine.Event.COMPLETE) && !isGiver) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the giver can do this");
        }

        booking.setStatus(BookingStateMachine.transition(booking.getStatus(), event));
        booking.setRespondedAt(Instant.now());
        if (event == BookingStateMachine.Event.CANCEL) booking.setCancelReason(cancelReason);
        if (event == BookingStateMachine.Event.COMPLETE) booking.setCompletedAt(Instant.now());

        // A declined/cancelled booking frees the favor up again; a completed one finishes it.
        if (event == BookingStateMachine.Event.DECLINE || event == BookingStateMachine.Event.CANCEL) {
            setFavorStatus(booking.getFavorId(), Favor.Status.OPEN);
        }
        if (event == BookingStateMachine.Event.COMPLETE) setFavorStatus(booking.getFavorId(), Favor.Status.CLOSED);
        bookingRepository.save(booking);
        events.publishEvent(new BookingStatusChanged(booking.getId(), actor.getId()));
        return BookingDto.from(booking);
    }

    /** Called by BookingLifecycleJob for a REQUESTED booking the giver never answered. Reopens the favor. */
    @Transactional
    public void expire(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        booking.setStatus(BookingStateMachine.transition(booking.getStatus(), BookingStateMachine.Event.EXPIRE));
        booking.setRespondedAt(Instant.now());
        bookingRepository.save(booking);
        setFavorStatus(booking.getFavorId(), Favor.Status.OPEN);
        events.publishEvent(new BookingStatusChanged(booking.getId(), null));
    }

    /** COMPLETED -> CLOSED once both reviews are in (ReviewService) or the review window ends (BookingLifecycleJob). */
    @Transactional
    public void closeIfCompleted(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() != Booking.Status.COMPLETED) return;
        booking.setStatus(BookingStateMachine.transition(booking.getStatus(), BookingStateMachine.Event.CLOSE));
        bookingRepository.save(booking);
    }

    private void setFavorStatus(Long favorId, Favor.Status status) {
        favorRepository.findById(favorId).ifPresent(f -> {
            f.setStatus(status);
            favorRepository.save(f);
        });
    }

    @Transactional(readOnly = true)
    public List<BookingListItemDto> forUser(Long userId, String role) {
        boolean asGiver = "giver".equalsIgnoreCase(role);
        List<Booking> list = asGiver
                ? bookingRepository.findByGiverIdOrderByRequestedAtDesc(userId)
                : bookingRepository.findByRequesterIdOrderByRequestedAtDesc(userId);

        Map<Long, String> names = userRepository.findAllById(list.stream()
                        .map(b -> asGiver ? b.getRequesterId() : b.getGiverId()).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(User::getId, User::getDisplayName));
        Map<Long, Favor> favors = favorRepository.findAllById(list.stream().map(Booking::getFavorId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Favor::getId, Function.identity()));

        return list.stream().map(b -> {
            Long otherId = asGiver ? b.getRequesterId() : b.getGiverId();
            Favor f = favors.get(b.getFavorId());
            Integer myStars = reviewRepository.findByBookingIdAndAuthorId(b.getId(), userId)
                    .map(r -> (int) r.getStars()).orElse(null);
            Instant expiresAt = b.getStatus() == Booking.Status.REQUESTED
                    ? b.getRequestedAt().plus(BookingLifecycleJob.REQUEST_TTL) : null;
            return new BookingListItemDto(b.getId(), b.getFavorId(), b.getStatus().name(), b.getOrigin().name(),
                    b.getPrice() != null ? b.getPrice() : f.getBudget(), b.getRequestedAt(), b.getCompletedAt(), expiresAt,
                    otherId, names.get(otherId), f.getTitle(), f.getCategory().getKey(),
                    f.getCategory().getNameEn(), f.getCategory().getNameMk(), f.getWhenType().name(), f.getWhenAt(), myStars);
        }).toList();
    }

    @Transactional(readOnly = true)
    public BookingDto get(Long id, User user) {
        Booking booking = findOrThrow(id);
        assertParticipant(booking, user.getId());
        return BookingDto.from(booking);
    }

    /** The phone number is only released after confirmation, and only to the two participants. */
    @Transactional(readOnly = true)
    public ContactDto getContact(Long bookingId, User user) {
        Booking booking = findOrThrow(bookingId);
        assertParticipant(booking, user.getId());
        if (!CONTACT_VISIBLE.contains(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Contact info is only available once the booking is confirmed");
        }
        Long otherId = booking.getRequesterId().equals(user.getId()) ? booking.getGiverId() : booking.getRequesterId();
        User other = userRepository.findById(otherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new ContactDto(other.getPhone(), other.getDisplayName());
    }

    private void assertParticipant(Booking b, Long userId) {
        if (!b.getRequesterId().equals(userId) && !b.getGiverId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant on this booking");
        }
    }

    private Booking findOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }
}
