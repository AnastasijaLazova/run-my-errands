package com.runmyerrands.booking;

/**
 * Published (inside the transaction) whenever a booking is created or changes status.
 * actorId is who caused it, or null for the scheduler (expiry).
 */
public record BookingStatusChanged(Long bookingId, Long actorId) {}
