package com.runmyerrands.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitReviewRequest(@NotNull @Min(1) @Max(5) Short stars, @Size(max = 2000) String text) {}
