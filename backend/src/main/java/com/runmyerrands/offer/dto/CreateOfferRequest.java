package com.runmyerrands.offer.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateOfferRequest(String message, BigDecimal proposedPrice, Instant proposedTime) {}
