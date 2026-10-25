package com.runmyerrands.offer.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateOfferRequest(
        @Size(max = 1000) String message,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal proposedPrice,
        Instant proposedTime) {}
