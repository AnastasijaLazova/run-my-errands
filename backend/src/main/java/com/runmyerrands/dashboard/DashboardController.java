package com.runmyerrands.dashboard;

import com.runmyerrands.dashboard.dto.RequesterDashboardDto;
import com.runmyerrands.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/requester")
    public RequesterDashboardDto requester(@AuthenticationPrincipal User me) {
        return dashboardService.requester(me);
    }
}
