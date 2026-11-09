package com.runmyerrands.booking.dto;

import com.runmyerrands.booking.Booking;

import java.math.BigDecimal;
import java.time.Instant;

/** paymentStatus is null until the requester pays (see PaymentDto for the details). */
public record BookingDto(Long id, Long favorId, Long requesterId, Long giverId, String origin, Long offerId,
                         String status, String note, BigDecimal price, Instant requestedAt, Instant respondedAt,
                         Instant completedAt, String cancelReason, String paymentStatus) {
    public static BookingDto from(Booking b) {
        return from(b, null);
    }

    public static BookingDto from(Booking b, String paymentStatus) {
        return new BookingDto(b.getId(), b.getFavorId(), b.getRequesterId(), b.getGiverId(), b.getOrigin().name(),
                b.getOfferId(), b.getStatus().name(), b.getNote(), b.getPrice(), b.getRequestedAt(), b.getRespondedAt(),
                b.getCompletedAt(), b.getCancelReason(), paymentStatus);
    }
}
