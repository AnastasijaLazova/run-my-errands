package com.runmyerrands.review;

import com.runmyerrands.review.dto.*;
import com.runmyerrands.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings/{bookingId}")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/review")
    public ReviewDto submit(@AuthenticationPrincipal User author, @PathVariable Long bookingId,
                            @Valid @RequestBody SubmitReviewRequest request) {
        return reviewService.submit(bookingId, author, request);
    }

    @GetMapping("/review-status")
    public ReviewStatusDto status(@AuthenticationPrincipal User user, @PathVariable Long bookingId) {
        return reviewService.status(bookingId, user);
    }
}
