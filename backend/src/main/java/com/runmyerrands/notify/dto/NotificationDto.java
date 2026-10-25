package com.runmyerrands.notify.dto;

import com.runmyerrands.notify.Notification;

import java.time.Instant;

public record NotificationDto(Long id, String type, Long bookingId, Long offerId, Long favorId,
                              String actorName, String favorTitle, Instant createdAt, boolean read) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(n.getId(), n.getType().name(), n.getBookingId(), n.getOfferId(), n.getFavorId(),
                n.getActorName(), n.getFavorTitle(), n.getCreatedAt(), n.getReadAt() != null);
    }
}
