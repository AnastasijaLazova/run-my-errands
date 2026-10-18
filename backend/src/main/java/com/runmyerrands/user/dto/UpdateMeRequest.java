package com.runmyerrands.user.dto;

public record UpdateMeRequest(String displayName, String phone, String neighbourhood, String avatarUrl, String locale) {}
