package com.runmyerrands.favor.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

/** Partial update: null fields are left unchanged. The category is fixed once posted (offers/matches depend on it). */
public record UpdateFavorRequest(
        @Pattern(regexp = ".*\\S.*", message = "Title can't be blank") @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Size(max = 120) String neighbourhood,
        String whenType, Instant whenAt,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal budget) {}
