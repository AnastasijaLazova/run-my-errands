package com.runmyerrands.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateMeRequest(
        @Size(max = 120) String displayName,
        @Size(max = 32) String phone,
        @Size(max = 120) String neighbourhood,
        @Size(max = 500) String avatarUrl,
        @Pattern(regexp = "en|mk", message = "Language must be en or mk") String locale) {}
