package com.runmyerrands.favor.dto;

import java.math.BigDecimal;

public record GiverMatchDto(Long userId, String displayName, String avatarUrl, String neighbourhood,
                            BigDecimal price, Double ratingAvg, Integer ratingCount,
                            boolean verified) {}
