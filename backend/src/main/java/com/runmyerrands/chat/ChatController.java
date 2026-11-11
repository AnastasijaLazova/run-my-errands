package com.runmyerrands.chat;

import com.runmyerrands.chat.dto.ChatReply;
import com.runmyerrands.chat.dto.ChatRequest;
import com.runmyerrands.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The in-app assistant: signed-in users only. */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ChatReply chat(@AuthenticationPrincipal User user, @Valid @RequestBody ChatRequest request) {
        return new ChatReply(chatService.reply(user, request.messages()));
    }
}
