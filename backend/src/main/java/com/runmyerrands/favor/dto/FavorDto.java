package com.runmyerrands.favor.dto;

import com.runmyerrands.favor.Favor;

import java.math.BigDecimal;
import java.time.Instant;

public record FavorDto(
        Long id, Long requesterId, Long categoryId, String categoryNameEn, String categoryNameMk,
        String title, String description, String neighbourhood,
        String whenType, Instant whenAt, BigDecimal budget, String status, String visibility, Instant createdAt) {
    public static FavorDto from(Favor f) {
        return new FavorDto(f.getId(), f.getRequesterId(), f.getCategory().getId(),
                f.getCategory().getNameEn(), f.getCategory().getNameMk(), f.getTitle(), f.getDescription(),
                f.getNeighbourhood(), f.getWhenType().name(), f.getWhenAt(),
                f.getBudget(), f.getStatus().name(), f.getVisibility().name(), f.getCreatedAt());
    }
}
