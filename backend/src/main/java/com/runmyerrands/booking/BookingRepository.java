package com.runmyerrands.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRequesterIdOrderByRequestedAtDesc(Long requesterId);
    List<Booking> findByGiverIdOrderByRequestedAtDesc(Long giverId);
    List<Booking> findByStatusAndRequestedAtBefore(Booking.Status status, Instant cutoff);
    List<Booking> findByStatusAndCompletedAtBefore(Booking.Status status, Instant cutoff);
    Optional<Booking> findByOfferId(Long offerId);
}
