package com.runmyerrands.user;

import com.runmyerrands.user.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public MeDto me(@AuthenticationPrincipal User user) {
        return MeDto.from(user);
    }

    @PatchMapping("/me")
    public MeDto updateMe(@AuthenticationPrincipal User user, @Valid @RequestBody UpdateMeRequest request) {
        return userService.updateMe(user, request);
    }

    @GetMapping("/givers/{id}")
    public GiverProfileDto giverProfile(@PathVariable Long id) {
        return userService.getGiverProfile(id);
    }

    @PutMapping("/me/giver-profile")
    public GiverProfileDto upsertGiverProfile(@AuthenticationPrincipal User user,
                                              @Valid @RequestBody UpsertGiverProfileRequest request) {
        return userService.upsertGiverProfile(user, request);
    }
}
