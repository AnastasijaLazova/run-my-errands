package com.runmyerrands.user;

import com.runmyerrands.category.Category;
import com.runmyerrands.category.CategoryRepository;
import com.runmyerrands.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GiverProfileRepository giverProfileRepository;
    private final GiverCategoryRepository giverCategoryRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public MeDto updateMe(User user, UpdateMeRequest request) {
        if (request.displayName() != null) user.setDisplayName(request.displayName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.neighbourhood() != null && !request.neighbourhood().isBlank()) user.setNeighbourhood(request.neighbourhood().trim());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.locale() != null) user.setLocale(request.locale());
        return MeDto.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public GiverProfileDto getGiverProfile(Long userId) {
        GiverProfile profile = giverProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No giver profile yet"));
        return GiverProfileDto.from(profile, giverCategoryRepository.findByUserId(userId));
    }

    /** Creates the Giver profile on first call, updates it afterwards. Flips User.giver = true. */
    @Transactional
    public GiverProfileDto upsertGiverProfile(User user, UpsertGiverProfileRequest request) {
        GiverProfile profile = giverProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            GiverProfile p = new GiverProfile();
            p.setUser(user);
            return p;
        });

        if (request.bio() != null) profile.setBio(request.bio());
        if (request.availability() != null) profile.setAvailability(request.availability());
        profile = giverProfileRepository.save(profile);

        if (request.categories() != null) {
            giverCategoryRepository.deleteByUserId(user.getId());
            giverCategoryRepository.flush();
            for (GiverCategoryInput input : request.categories()) {
                Category category = categoryRepository.findById(input.categoryId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category"));
                GiverCategory gc = new GiverCategory();
                gc.setUserId(user.getId());
                gc.setCategory(category);
                gc.setPrice(input.price());
                giverCategoryRepository.save(gc);
            }
        }

        if (!user.isGiver()) {
            user.setGiver(true);
            userRepository.save(user);
        }
        return GiverProfileDto.from(profile, giverCategoryRepository.findByUserId(user.getId()));
    }
}
