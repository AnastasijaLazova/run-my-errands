package com.runmyerrands.favor;

import com.runmyerrands.favor.dto.*;
import com.runmyerrands.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/favors")
@RequiredArgsConstructor
public class FavorController {

    private final FavorService favorService;

    @PostMapping
    public FavorDto create(@AuthenticationPrincipal User requester, @Valid @RequestBody CreateFavorRequest request) {
        return favorService.create(requester, request);
    }

    @GetMapping("/open")
    public List<FavorDto> open(@RequestParam(required = false) Long categoryId) {
        return favorService.open(categoryId);
    }

    @GetMapping("/mine")
    public List<FavorDto> mine(@AuthenticationPrincipal User requester) {
        return favorService.mine(requester.getId());
    }

    @GetMapping("/{id}")
    public FavorDto get(@PathVariable Long id) {
        return favorService.get(id);
    }

    @GetMapping("/{id}/matches")
    public List<GiverMatchDto> matches(@PathVariable Long id, @RequestParam(required = false) String sort) {
        return favorService.findMatches(id, sort);
    }
    // TODO next: PATCH /{id}, DELETE /{id}
}
