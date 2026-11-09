package com.runmyerrands.payment;

import com.runmyerrands.payment.dto.CancelPreviewDto;
import com.runmyerrands.payment.dto.PayRequest;
import com.runmyerrands.payment.dto.PaymentDto;
import com.runmyerrands.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings/{bookingId}")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/payment")
    public PaymentDto get(@AuthenticationPrincipal User user, @PathVariable Long bookingId) {
        return paymentService.get(bookingId, user);
    }

    @PostMapping("/pay")
    public PaymentDto pay(@AuthenticationPrincipal User user, @PathVariable Long bookingId,
                          @Valid @RequestBody PayRequest request) {
        return paymentService.pay(bookingId, user, request);
    }

    @GetMapping("/cancel-preview")
    public CancelPreviewDto cancelPreview(@AuthenticationPrincipal User user, @PathVariable Long bookingId) {
        return paymentService.cancelPreview(bookingId, user);
    }
}
