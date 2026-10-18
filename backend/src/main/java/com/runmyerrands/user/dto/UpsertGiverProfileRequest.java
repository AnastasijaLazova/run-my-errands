package com.runmyerrands.user.dto;

import java.util.List;

public record UpsertGiverProfileRequest(String bio, String availability, List<GiverCategoryInput> categories) {}
