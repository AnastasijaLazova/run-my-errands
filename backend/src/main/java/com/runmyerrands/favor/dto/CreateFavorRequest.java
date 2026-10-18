package com.runmyerrands.favor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateFavorRequest(
        @NotNull Long categoryId, @NotBlank String title, String description,
        String neighbourhood,
        String whenType, Instant whenAt, BigDecimal budget) {}
