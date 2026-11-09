package com.runmyerrands.payment;

import com.runmyerrands.favor.Favor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;

/**
 * The money rules, kept free of the database so they are easy to test and to show in the UI before acting.
 *
 *   - The requester pays price + a 10% service fee; the fee is the platform's and is only returned when the
 *     giver cancels.
 *   - The requester can cancel for a full refund of the price for 10 minutes after paying, or, for a scheduled
 *     favor, until 24 hours before it starts (whichever is later).
 *   - After that, a requester cancel refunds half the price and pays the other half to the giver.
 *   - A cancel by the giver (or anyone other than the requester) refunds everything, fee included.
 */
public final class CancellationPolicy {

    public static final BigDecimal FEE_RATE = new BigDecimal("0.10");
    public static final Duration ASAP_WINDOW = Duration.ofMinutes(10);
    public static final Duration SCHEDULED_CUTOFF = Duration.ofHours(24);
    public static final BigDecimal LATE_REFUND_SHARE = new BigDecimal("0.50");

    /** free: the requester got the whole price back (no compensation to the giver). */
    public record Outcome(BigDecimal refund, BigDecimal giverPayout, boolean free) {}

    private CancellationPolicy() {}

    /** Rounded to whole denars. */
    public static BigDecimal fee(BigDecimal price) {
        return price.multiply(FEE_RATE).setScale(0, RoundingMode.HALF_UP);
    }

    public static Instant freeUntil(Instant paidAt, Favor.WhenType whenType, Instant whenAt) {
        Instant grace = paidAt.plus(ASAP_WINDOW);
        if (whenType == Favor.WhenType.SCHEDULED && whenAt != null) {
            Instant cutoff = whenAt.minus(SCHEDULED_CUTOFF);
            if (cutoff.isAfter(grace)) return cutoff;
        }
        return grace;
    }

    public static Outcome onCancel(BigDecimal amount, BigDecimal fee, boolean byRequester, Instant freeUntil, Instant now) {
        if (!byRequester) return new Outcome(amount.add(fee), BigDecimal.ZERO, true);
        if (now.isBefore(freeUntil)) return new Outcome(amount, BigDecimal.ZERO, true);
        BigDecimal refund = amount.multiply(LATE_REFUND_SHARE).setScale(2, RoundingMode.HALF_UP);
        return new Outcome(refund, amount.subtract(refund), false);
    }
}
