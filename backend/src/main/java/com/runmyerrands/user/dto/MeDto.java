package com.runmyerrands.user.dto;

import com.runmyerrands.user.User;

public record MeDto(Long id, String email, String displayName, String phone, String neighbourhood,
                    String avatarUrl, String locale, boolean requester, boolean giver) {
    public static MeDto from(User u) {
        return new MeDto(u.getId(), u.getEmail(), u.getDisplayName(), u.getPhone(), u.getNeighbourhood(),
                u.getAvatarUrl(), u.getLocale(), u.isRequester(), u.isGiver());
    }
}
