package com.runmyerrands.landing.dto;

import java.math.BigDecimal;
import java.util.List;

/** Everything the public landing page shows, from real data. Names are shortened to "First L." for privacy. */
public record LandingDto(List<CategoryCard> categories, Stats stats, List<FeaturedGiver> givers, List<ReviewCard> reviews) {

    /** fromPrice is the cheapest Giver price in the category; null while nobody offers it. */
    public record CategoryCard(Long id, String key, String nameEn, String nameMk, String trustTier,
                               BigDecimal fromPrice, int giverCount) {}

    public record Stats(int categoryCount, int giverCount, int completedCount) {}

    public record FeaturedGiver(String name, String neighbourhood, BigDecimal ratingAvg, int ratingCount, BigDecimal fromPrice) {}

    public record ReviewCard(String authorName, short stars, String text, String categoryKey, String categoryNameEn, String categoryNameMk) {}
}
