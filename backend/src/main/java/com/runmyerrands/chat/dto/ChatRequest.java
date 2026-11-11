package com.runmyerrands.chat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** The conversation so far, oldest first, ending with the user's new message. Nothing is stored server-side. */
public record ChatRequest(@NotEmpty List<@Valid ChatMessageDto> messages) {}
