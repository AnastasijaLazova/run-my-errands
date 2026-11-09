package com.runmyerrands.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByBookingId(Long bookingId);
    List<Payment> findByBookingIdIn(Collection<Long> bookingIds);
    boolean existsByBookingIdAndStatus(Long bookingId, Payment.Status status);

    /** What the giver was actually paid out (completed jobs plus late-cancel compensation) since a moment. */
    @Query("select coalesce(sum(p.giverPayout), 0) from Payment p where p.giverId = :giverId and p.settledAt >= :since")
    BigDecimal sumGiverPayoutSince(Long giverId, Instant since);

    /** What the requester was charged and did not get back, since a moment. */
    @Query("select coalesce(sum(p.total - p.refundAmount), 0) from Payment p where p.requesterId = :requesterId and p.paidAt >= :since")
    BigDecimal sumSpentSince(Long requesterId, Instant since);
}
