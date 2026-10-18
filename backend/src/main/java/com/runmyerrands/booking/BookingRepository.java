package com.runmyerrands.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRequesterIdOrderByRequestedAtDesc(Long requesterId);
    List<Booking> findByGiverIdOrderByRequestedAtDesc(Long giverId);
}
