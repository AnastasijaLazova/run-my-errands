package com.runmyerrands.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank String displayName,
        @NotBlank String neighbourhood,
        String phone,
        /** REQUESTER, GIVER or BOTH; null means REQUESTER. */
        @Pattern(regexp = "REQUESTER|GIVER|BOTH") String role) {}
