package com.runmyerrands.user.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record GiverCategoryInput(@NotNull Long categoryId, @NotNull @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal price) {}
