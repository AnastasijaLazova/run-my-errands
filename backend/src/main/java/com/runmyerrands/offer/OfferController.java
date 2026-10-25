package com.runmyerrands.offer;

import com.runmyerrands.booking.dto.BookingDto;
import com.runmyerrands.offer.dto.CreateOfferRequest;
import com.runmyerrands.offer.dto.OfferDto;
import com.runmyerrands.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @PostMapping("/api/v1/favors/{favorId}/offers")
    public OfferDto create(@AuthenticationPrincipal User giver, @PathVariable Long favorId,
                           @Valid @RequestBody CreateOfferRequest request) {
        return offerService.create(giver, favorId, request);
    }

    @GetMapping("/api/v1/favors/{favorId}/offers")
    public List<OfferDto> forFavor(@AuthenticationPrincipal User requester, @PathVariable Long favorId) {
        return offerService.forFavor(favorId, requester);
    }

    @GetMapping("/api/v1/offers/mine")
    public List<OfferDto> mine(@AuthenticationPrincipal User giver) {
        return offerService.mine(giver.getId());
    }

    @PostMapping("/api/v1/offers/{id}/accept")
    public BookingDto accept(@AuthenticationPrincipal User requester, @PathVariable Long id) {
        return offerService.accept(id, requester);
    }

    @PostMapping("/api/v1/offers/{id}/reject")
    public OfferDto reject(@AuthenticationPrincipal User requester, @PathVariable Long id) {
        return offerService.reject(id, requester);
    }

    @PostMapping("/api/v1/offers/{id}/withdraw")
    public OfferDto withdraw(@AuthenticationPrincipal User giver, @PathVariable Long id) {
        return offerService.withdraw(id, giver);
    }
}
