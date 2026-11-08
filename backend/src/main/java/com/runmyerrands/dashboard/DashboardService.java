package com.runmyerrands.dashboard;

import com.runmyerrands.booking.Booking;
import com.runmyerrands.booking.BookingLifecycleJob;
import com.runmyerrands.booking.BookingRepository;
import com.runmyerrands.dashboard.dto.GiverDashboardDto;
import com.runmyerrands.dashboard.dto.RequesterDashboardDto;
import com.runmyerrands.dashboard.dto.RequesterDashboardDto.*;
import com.runmyerrands.favor.Favor;
import com.runmyerrands.favor.FavorRepository;
import com.runmyerrands.favor.FavorService;
import com.runmyerrands.review.Review;
import com.runmyerrands.review.ReviewRepository;
import com.runmyerrands.user.GiverProfile;
import com.runmyerrands.user.GiverProfileRepository;
import com.runmyerrands.user.User;
import com.runmyerrands.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Everything the requester and giver home screens show, one call each. */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final ZoneId SKOPJE = ZoneId.of("Europe/Skopje");
    private static final int MAX_ROWS = 10;
    private static final Set<Booking.Status> DONE = EnumSet.of(Booking.Status.COMPLETED, Booking.Status.CLOSED);
    private static final Set<Booking.Status> DEAD =
            EnumSet.of(Booking.Status.DECLINED, Booking.Status.CANCELLED, Booking.Status.EXPIRED);

    private final FavorRepository favorRepository;
    private final FavorService favorService;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final GiverProfileRepository giverProfileRepository;

    @Transactional(readOnly = true)
    public RequesterDashboardDto requester(User me) {
        List<Favor> favors = favorRepository.findByRequesterIdOrderByCreatedAtDesc(me.getId());
        List<Booking> bookings = bookingRepository.findByRequesterIdOrderByRequestedAtDesc(me.getId());

        Map<Long, String> giverNames = userRepository.findAllById(
                        bookings.stream().map(Booking::getGiverId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(User::getId, User::getDisplayName));
        Map<Long, Favor> favorsById = favors.stream().collect(Collectors.toMap(Favor::getId, Function.identity()));

        // Newest live booking per favor (bookings are already newest-first).
        Map<Long, Booking> currentBooking = new HashMap<>();
        for (Booking b : bookings) {
            if (!DEAD.contains(b.getStatus())) currentBooking.putIfAbsent(b.getFavorId(), b);
        }

        Set<Long> needsRating = new HashSet<>();
        for (Booking b : bookings) {
            if (DONE.contains(b.getStatus())
                    && reviewRepository.findByBookingIdAndAuthorId(b.getId(), me.getId()).isEmpty()) {
                needsRating.add(b.getId());
            }
        }

        List<RequestRow> rows = favors.stream()
                .filter(f -> f.getStatus() != Favor.Status.CANCELLED)
                .limit(MAX_ROWS)
                .map(f -> {
                    Booking b = currentBooking.get(f.getId());
                    BookingSummary summary = b == null ? null : new BookingSummary(b.getId(), b.getStatus().name(),
                            giverNames.get(b.getGiverId()), b.getPrice(), b.getCompletedAt(), needsRating.contains(b.getId()));
                    Integer matchCount = f.getStatus() == Favor.Status.OPEN ? favorService.countMatches(f) : null;
                    return new RequestRow(f.getId(), f.getTitle(), f.getCategory().getKey(), f.getBudget(),
                            f.getStatus().name(), f.getWhenType().name(), f.getWhenAt(), matchCount, summary);
                })
                .toList();

        List<ToRate> toRate = bookings.stream()
                .filter(b -> needsRating.contains(b.getId()))
                .map(b -> new ToRate(b.getId(), giverNames.get(b.getGiverId()),
                        Optional.ofNullable(favorsById.get(b.getFavorId())).map(Favor::getTitle).orElse(""),
                        b.getCompletedAt()))
                .toList();

        Instant monthStart = LocalDate.now(SKOPJE).withDayOfMonth(1).atStartOfDay(SKOPJE).toInstant();
        List<Booking> done = bookings.stream().filter(b -> DONE.contains(b.getStatus())).toList();
        BigDecimal spent = done.stream()
                .filter(b -> b.getCompletedAt() != null && !b.getCompletedAt().isBefore(monthStart))
                .map(b -> b.getPrice() != null ? b.getPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Stats stats = new Stats(done.size(), me.getRequesterRatingAvg(), me.getRequesterRatingCount(), spent);
        return new RequesterDashboardDto(stats, rows, toRate);
    }

    @Transactional(readOnly = true)
    public GiverDashboardDto giver(User me) {
        List<Booking> bookings = bookingRepository.findByGiverIdOrderByRequestedAtDesc(me.getId());

        Map<Long, String> requesterNames = userRepository.findAllById(
                        bookings.stream().map(Booking::getRequesterId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(User::getId, User::getDisplayName));
        Map<Long, Favor> favors = favorRepository.findAllById(
                        bookings.stream().map(Booking::getFavorId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(Favor::getId, Function.identity()));

        List<GiverDashboardDto.IncomingRequest> requests = bookings.stream()
                .filter(b -> b.getStatus() == Booking.Status.REQUESTED)
                .map(b -> {
                    Favor f = favors.get(b.getFavorId());
                    return new GiverDashboardDto.IncomingRequest(b.getId(), requesterNames.get(b.getRequesterId()),
                            f.getCategory().getKey(), f.getCategory().getNameEn(), f.getCategory().getNameMk(),
                            f.getNeighbourhood(), f.getWhenType().name(), f.getWhenAt(),
                            b.getPrice() != null ? b.getPrice() : f.getBudget(),
                            b.getNote() != null && !b.getNote().isBlank() ? b.getNote() : f.getDescription(),
                            b.getRequestedAt(), b.getRequestedAt().plus(BookingLifecycleJob.REQUEST_TTL));
                })
                .toList();

        List<GiverDashboardDto.Upcoming> upcoming = bookings.stream()
                .filter(b -> b.getStatus() == Booking.Status.CONFIRMED)
                .map(b -> {
                    Favor f = favors.get(b.getFavorId());
                    return new GiverDashboardDto.Upcoming(b.getId(), requesterNames.get(b.getRequesterId()),
                            f.getTitle(), f.getWhenType().name(), f.getWhenAt(),
                            b.getPrice() != null ? b.getPrice() : f.getBudget());
                })
                .toList();

        // Only ratings received as a giver — the same user can also be rated as a requester.
        Set<Long> giverBookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toSet());
        List<Review> reviews = reviewRepository.findByTargetIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(me.getId())
                .stream().filter(r -> giverBookingIds.contains(r.getBookingId())).limit(5).toList();
        Map<Long, String> authorNames = userRepository.findAllById(
                        reviews.stream().map(Review::getAuthorId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(User::getId, User::getDisplayName));
        List<GiverDashboardDto.RecentRating> recentRatings = reviews.stream()
                .map(r -> new GiverDashboardDto.RecentRating(authorNames.get(r.getAuthorId()), r.getStars(),
                        r.getText(), r.getPublishedAt()))
                .toList();

        int completed = (int) bookings.stream().filter(b -> DONE.contains(b.getStatus())).count();
        Optional<GiverProfile> profile = giverProfileRepository.findByUserId(me.getId());

        // Accept rate only looks at direct requests the giver had to answer. Offers are the giver's own
        // idea, and a cancelled request says nothing about whether they would have said yes.
        List<Booking> answered = bookings.stream()
                .filter(b -> b.getOrigin() == Booking.Origin.DIRECT_REQUEST)
                .filter(b -> b.getStatus() != Booking.Status.REQUESTED && b.getStatus() != Booking.Status.CANCELLED)
                .toList();
        long accepted = answered.stream()
                .filter(b -> b.getStatus() != Booking.Status.DECLINED && b.getStatus() != Booking.Status.EXPIRED).count();
        Integer acceptRate = answered.isEmpty() ? null : (int) Math.round(100.0 * accepted / answered.size());

        Instant monthStart = LocalDate.now(SKOPJE).withDayOfMonth(1).atStartOfDay(SKOPJE).toInstant();
        BigDecimal earned = bookings.stream()
                .filter(b -> DONE.contains(b.getStatus()) && b.getCompletedAt() != null && !b.getCompletedAt().isBefore(monthStart))
                .map(b -> b.getPrice() != null ? b.getPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        GiverDashboardDto.Stats stats = new GiverDashboardDto.Stats(completed,
                profile.map(GiverProfile::getRatingAvg).orElse(BigDecimal.ZERO),
                profile.map(GiverProfile::getRatingCount).orElse(0), acceptRate, earned);
        return new GiverDashboardDto(stats, requests, upcoming, recentRatings);
    }
}
