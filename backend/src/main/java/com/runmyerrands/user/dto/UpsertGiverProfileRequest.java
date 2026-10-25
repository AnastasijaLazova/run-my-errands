package com.runmyerrands.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpsertGiverProfileRequest(
        @Size(max = 2000) String bio,
        @Size(max = 255) String availability,
        List<@Valid GiverCategoryInput> categories) {}
