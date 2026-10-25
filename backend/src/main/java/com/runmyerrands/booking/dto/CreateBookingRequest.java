package com.runmyerrands.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateBookingRequest(@NotNull Long favorId, @NotNull Long giverId, @Size(max = 1000) String note) {}
