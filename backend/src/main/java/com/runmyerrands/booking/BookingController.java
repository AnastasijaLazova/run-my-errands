package com.runmyerrands.booking;

import com.runmyerrands.booking.dto.*;
import com.runmyerrands.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public BookingDto create(@AuthenticationPrincipal User requester, @Valid @RequestBody CreateBookingRequest request) {
        return bookingService.createDirect(requester, request);
    }

    @GetMapping
    public List<BookingDto> list(@AuthenticationPrincipal User user, @RequestParam(required = false) String role) {
        return bookingService.forUser(user.getId(), role);
    }

    @GetMapping("/{id}")
    public BookingDto get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return bookingService.get(id, user);
    }

    @PostMapping("/{id}/accept")
    public BookingDto accept(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return bookingService.respond(id, user, BookingStateMachine.Event.ACCEPT, null);
    }

    @PostMapping("/{id}/decline")
    public BookingDto decline(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return bookingService.respond(id, user, BookingStateMachine.Event.DECLINE, null);
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@AuthenticationPrincipal User user, @PathVariable Long id,
                             @RequestBody(required = false) Map<String, String> body) {
        return bookingService.respond(id, user, BookingStateMachine.Event.CANCEL, body != null ? body.get("reason") : null);
    }

    @PostMapping("/{id}/complete")
    public BookingDto complete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return bookingService.respond(id, user, BookingStateMachine.Event.COMPLETE, null);
    }

    @GetMapping("/{id}/contact")
    public ContactDto contact(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return bookingService.getContact(id, user);
    }
}
