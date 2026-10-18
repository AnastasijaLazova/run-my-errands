package com.runmyerrands.dashboard.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record RequesterDashboardDto(Stats stats, List<RequestRow> requests, List<ToRate> toRate) {

    public record Stats(int completedCount, BigDecimal ratingAvg, int ratingCount, BigDecimal spentThisMonth) {}

    /** One favor plus its current booking (if any) — enough for a row on the dashboard. */
    public record RequestRow(Long favorId, String title, String categoryKey, BigDecimal budget, String favorStatus,
                             String whenType, Instant whenAt, Integer matchCount, BookingSummary booking) {}

    public record BookingSummary(Long id, String status, String giverName, BigDecimal price,
                                 Instant completedAt, boolean needsRating) {}

    public record ToRate(Long bookingId, String giverName, String favorTitle, Instant completedAt) {}
}
