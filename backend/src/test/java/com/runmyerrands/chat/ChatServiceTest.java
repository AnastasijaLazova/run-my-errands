package com.runmyerrands.chat;

import com.runmyerrands.chat.dto.ChatMessageDto;
import com.runmyerrands.chat.dto.ChatMessageDto.Role;
import com.runmyerrands.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ChatServiceTest {

    private static ChatMessageDto msg(Role role, String text) { return new ChatMessageDto(role, text); }

    @Test
    void shortHistoryIsSentAsIs() {
        List<ChatMessageDto> history = List.of(msg(Role.user, "hi"), msg(Role.assistant, "hello"), msg(Role.user, "help"));
        assertEquals(history, ChatService.recent(history));
    }

    @Test
    void longHistoryKeepsTheLastTurnsAndStartsWithTheUser() {
        List<ChatMessageDto> history = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            history.add(msg(Role.user, "q" + i));
            history.add(msg(Role.assistant, "a" + i));
        }
        history.add(msg(Role.user, "last"));

        List<ChatMessageDto> recent = ChatService.recent(history);
        assertTrue(recent.size() <= ChatService.MAX_HISTORY);
        assertEquals(Role.user, recent.getFirst().role());
        assertEquals("last", recent.getLast().content());
    }

    @Test
    void withoutAnApiKeyTheAssistantIsUnavailable() {
        ChatService service = new ChatService("", "claude-opus-5-5");
        var ex = assertThrows(ResponseStatusException.class,
                () -> service.reply(new User(), List.of(msg(Role.user, "hi"))));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }

    @Test
    void conversationMustEndWithTheUser() {
        ChatService service = new ChatService("test-key", "claude-opus-5-5");
        var ex = assertThrows(ResponseStatusException.class,
                () -> service.reply(new User(), List.of(msg(Role.user, "hi"), msg(Role.assistant, "hello"))));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void promptQuotesTheRealMoneyRulesAndTheUser() {
        User user = new User();
        user.setDisplayName("Ana Petrovska");
        user.setLocale("mk");
        String prompt = ChatPrompt.system(user, LocalDate.of(2026, 11, 10));
        assertTrue(prompt.contains("10% service fee"));
        assertTrue(prompt.contains("for 10 minutes after paying"));
        assertTrue(prompt.contains("until 24 hours before"));
        assertTrue(prompt.contains("about 25% of"));
        assertTrue(prompt.contains("Ana Petrovska"));
        assertTrue(prompt.contains("Macedonian"));
    }
}
