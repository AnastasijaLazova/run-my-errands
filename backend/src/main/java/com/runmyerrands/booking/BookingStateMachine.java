package com.runmyerrands.booking;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * The single place that knows which booking transitions are legal:
 *   REQUESTED -accept-> CONFIRMED -complete-> COMPLETED -close-> CLOSED
 *   REQUESTED -decline-> DECLINED | REQUESTED -expire-> EXPIRED
 *   REQUESTED/CONFIRMED -cancel-> CANCELLED
 */
public final class BookingStateMachine {

    public enum Event { ACCEPT, DECLINE, CANCEL, COMPLETE, EXPIRE, CLOSE }

    private static final Map<Booking.Status, Set<Event>> ALLOWED = new EnumMap<>(Booking.Status.class);
    static {
        ALLOWED.put(Booking.Status.REQUESTED, EnumSet.of(Event.ACCEPT, Event.DECLINE, Event.CANCEL, Event.EXPIRE));
        ALLOWED.put(Booking.Status.CONFIRMED, EnumSet.of(Event.COMPLETE, Event.CANCEL));
        ALLOWED.put(Booking.Status.COMPLETED, EnumSet.of(Event.CLOSE));
    }

    private BookingStateMachine() {}

    public static Booking.Status transition(Booking.Status from, Event event) {
        if (!ALLOWED.getOrDefault(from, Set.of()).contains(event)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot " + event + " a booking in status " + from);
        }
        return switch (event) {
            case ACCEPT -> Booking.Status.CONFIRMED;
            case DECLINE -> Booking.Status.DECLINED;
            case CANCEL -> Booking.Status.CANCELLED;
            case COMPLETE -> Booking.Status.COMPLETED;
            case EXPIRE -> Booking.Status.EXPIRED;
            case CLOSE -> Booking.Status.CLOSED;
        };
    }
}
