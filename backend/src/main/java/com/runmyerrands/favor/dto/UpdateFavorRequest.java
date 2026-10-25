package com.runmyerrands.favor.dto;

import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.Instant;

/** Partial update: null fields are left unchanged. The category is fixed once posted (offers/matches depend on it). */
public record UpdateFavorRequest(
        @Pattern(regexp = ".*\\S.*", message = "Title can't be blank") String title,
        String description, String neighbourhood,
        String whenType, Instant whenAt, BigDecimal budget) {}
