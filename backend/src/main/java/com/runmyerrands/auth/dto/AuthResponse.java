package com.runmyerrands.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, Long userId, String displayName) {}
