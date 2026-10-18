package com.runmyerrands.user.dto;

import com.runmyerrands.user.GiverCategory;
import com.runmyerrands.user.GiverProfile;

import java.math.BigDecimal;
import java.util.List;

public record GiverProfileDto(
        Long userId, String displayName, String neighbourhood, String bio, String availability, boolean verified,
        BigDecimal ratingAvg, Integer ratingCount, Integer completedCount,
        List<GiverCategoryDto> categories) {

    public record GiverCategoryDto(Long categoryId, String nameEn, String nameMk, BigDecimal price) {
        public static GiverCategoryDto from(GiverCategory gc) {
            return new GiverCategoryDto(gc.getCategory().getId(), gc.getCategory().getNameEn(),
                    gc.getCategory().getNameMk(), gc.getPrice());
        }
    }

    public static GiverProfileDto from(GiverProfile p, List<GiverCategory> categories) {
        return new GiverProfileDto(p.getUserId(), p.getUser().getDisplayName(), p.getUser().getNeighbourhood(),
                p.getBio(), p.getAvailability(), p.isVerified(),
                p.getRatingAvg(), p.getRatingCount(), p.getCompletedCount(),
                categories.stream().map(GiverCategoryDto::from).toList());
    }
}
