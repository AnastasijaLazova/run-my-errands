package com.runmyerrands.favor.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateFavorRequest(
        @NotNull Long categoryId,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Size(max = 120) String neighbourhood,
        String whenType, Instant whenAt,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal budget) {}
