package com.runmyerrands.booking.dto;

import com.runmyerrands.booking.Booking;

import java.math.BigDecimal;
import java.time.Instant;

public record BookingDto(Long id, Long favorId, Long requesterId, Long giverId, String origin, Long offerId,
                         String status, String note, BigDecimal price, Instant requestedAt, Instant respondedAt,
                         Instant completedAt, String cancelReason) {
    public static BookingDto from(Booking b) {
        return new BookingDto(b.getId(), b.getFavorId(), b.getRequesterId(), b.getGiverId(), b.getOrigin().name(),
                b.getOfferId(), b.getStatus().name(), b.getNote(), b.getPrice(), b.getRequestedAt(), b.getRespondedAt(),
                b.getCompletedAt(), b.getCancelReason());
    }
}
