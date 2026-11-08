package com.runmyerrands.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One row of "My bookings": the booking plus what the list shows about it, so the page needs one call.
 * "other" is the person on the opposite side from the viewer; myStars is the review the viewer left, if any.
 */
public record BookingListItemDto(Long id, Long favorId, String status, String origin, BigDecimal price,
                                 Instant requestedAt, Instant completedAt, Instant expiresAt,
                                 Long otherUserId, String otherName,
                                 String favorTitle, String categoryKey, String categoryNameEn, String categoryNameMk,
                                 String whenType, Instant whenAt, Integer myStars) {}
