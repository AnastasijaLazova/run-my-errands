package com.runmyerrands.notify.dto;

import com.runmyerrands.notify.Notification;

import java.math.BigDecimal;
import java.time.Instant;

public record NotificationDto(Long id, String type, Long bookingId, Long offerId, Long favorId,
                              String actorName, String favorTitle, BigDecimal amount, Instant createdAt, boolean read) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(n.getId(), n.getType().name(), n.getBookingId(), n.getOfferId(), n.getFavorId(),
                n.getActorName(), n.getFavorTitle(), n.getAmount(), n.getCreatedAt(), n.getReadAt() != null);
    }
}
