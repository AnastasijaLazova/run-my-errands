package com.runmyerrands.booking.dto;

import jakarta.validation.constraints.NotNull;

public record CreateBookingRequest(@NotNull Long favorId, @NotNull Long giverId, String note) {}
