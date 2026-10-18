package com.runmyerrands.category;

public record CategoryDto(Long id, String key, String nameEn, String nameMk, String trustTier) {
    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getId(), c.getKey(), c.getNameEn(), c.getNameMk(), c.getTrustTier().name());
    }
}
