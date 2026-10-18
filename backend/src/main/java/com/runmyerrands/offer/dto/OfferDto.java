package com.runmyerrands.offer.dto;

import com.runmyerrands.offer.Offer;

import java.math.BigDecimal;
import java.time.Instant;

public record OfferDto(Long id, Long favorId, Long giverId, String message, BigDecimal proposedPrice,
                       Instant proposedTime, String status, Instant createdAt) {
    public static OfferDto from(Offer o) {
        return new OfferDto(o.getId(), o.getFavorId(), o.getGiverId(), o.getMessage(), o.getProposedPrice(),
                o.getProposedTime(), o.getStatus().name(), o.getCreatedAt());
    }
}
