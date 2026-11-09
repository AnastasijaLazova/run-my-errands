package com.runmyerrands.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * What cancelling right now would do to the money, so the dialog can say it before the user confirms.
 * paid=false means nothing was charged and nothing happens; freeUntil is null when the giver is asking.
 */
public record CancelPreviewDto(boolean paid, BigDecimal refund, BigDecimal giverPayout, boolean free, Instant freeUntil) {}
