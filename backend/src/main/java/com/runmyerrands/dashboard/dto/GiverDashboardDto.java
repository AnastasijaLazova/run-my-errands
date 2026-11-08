package com.runmyerrands.dashboard.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record GiverDashboardDto(Stats stats, List<IncomingRequest> requests, List<Upcoming> upcoming,
                                List<RecentRating> recentRatings) {

    /** acceptRate: % of answered direct requests the giver accepted (null until one is answered). */
    public record Stats(int completedCount, BigDecimal ratingAvg, int ratingCount, Integer acceptRate,
                        BigDecimal earnedThisMonth) {}

    /** A booking request waiting for this giver to accept or decline. */
    public record IncomingRequest(Long bookingId, String requesterName, String categoryKey, String categoryNameEn,
                                  String categoryNameMk, String neighbourhood, String whenType, Instant whenAt,
                                  BigDecimal price, String note, Instant requestedAt, Instant expiresAt) {}

    /** A confirmed booking the giver still has to do. */
    public record Upcoming(Long bookingId, String requesterName, String favorTitle, String whenType, Instant whenAt,
                           BigDecimal price) {}

    public record RecentRating(String authorName, int stars, String text, Instant publishedAt) {}
}
