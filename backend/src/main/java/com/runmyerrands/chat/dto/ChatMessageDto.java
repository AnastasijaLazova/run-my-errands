package com.runmyerrands.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** One turn of the conversation, as the chat window keeps it. */
public record ChatMessageDto(@NotNull Role role, @NotBlank @Size(max = 2000) String content) {

    public enum Role { user, assistant }
}
