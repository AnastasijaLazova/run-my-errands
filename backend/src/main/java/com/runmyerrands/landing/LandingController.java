package com.runmyerrands.landing;

import com.runmyerrands.landing.dto.LandingDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public data for the page shown before login. */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class LandingController {

    private final LandingRepository landingRepository;

    @GetMapping("/landing")
    public LandingDto landing() {
        return new LandingDto(landingRepository.categories(), landingRepository.stats(),
                landingRepository.topGivers(2), landingRepository.recentReviews(3));
    }
}
