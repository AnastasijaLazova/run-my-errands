package com.runmyerrands.dashboard;

import com.runmyerrands.booking.Booking;
import com.runmyerrands.booking.BookingRepository;
import com.runmyerrands.dashboard.dto.RequesterDashboardDto;
import com.runmyerrands.dashboard.dto.RequesterDashboardDto.*;
import com.runmyerrands.favor.Favor;
import com.runmyerrands.favor.FavorRepository;
import com.runmyerrands.favor.FavorService;
import com.runmyerrands.review.ReviewRepository;
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

/** Everything the requester home screen shows, in one call. */
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
}
