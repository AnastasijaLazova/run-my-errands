package com.runmyerrands.chat;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.beta.messages.BetaMessage;
import com.anthropic.models.beta.messages.BetaOutputConfig;
import com.anthropic.models.beta.messages.BetaStopReason;
import com.anthropic.models.beta.messages.BetaTextBlock;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.runmyerrands.chat.dto.ChatMessageDto;
import com.runmyerrands.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Sends the conversation to Claude and returns its answer. Stateless: the chat window sends the recent history
 * with every message, so nothing about the conversation is stored.
 */
@Service
public class ChatService {

    /** Older turns are dropped; enough for a conversation, bounded in cost. */
    static final int MAX_HISTORY = 20;
    private static final ZoneId SKOPJE = ZoneId.of("Europe/Skopje");

    private final AnthropicClient client;   // null when no API key is configured
    private final String model;

    public ChatService(@Value("${app.chat.api-key:}") String apiKey, @Value("${app.chat.model}") String model) {
        this.client = apiKey.isBlank() ? null
                : AnthropicOkHttpClient.builder().apiKey(apiKey).timeout(Duration.ofSeconds(60)).build();
        this.model = model;
    }

    public String reply(User user, List<ChatMessageDto> history) {
        if (client == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant is not set up on this server");
        }
        List<ChatMessageDto> turns = recent(history);
        if (turns.isEmpty() || turns.getLast().role() != ChatMessageDto.Role.user) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The conversation must end with a user message");
        }

        MessageCreateParams.Builder params = MessageCreateParams.builder()
                .model(model)
                .maxTokens(16000L)
                .system(ChatPrompt.system(user, LocalDate.now(SKOPJE)))
                // Chat wants quick, short answers; low effort keeps latency down.
                .outputConfig(BetaOutputConfig.builder().effort(BetaOutputConfig.Effort.LOW).build())
                // If a safety check declines a message, the API retries it on a fallback model instead of stopping.
                .addBeta("server-side-fallback-2026-07-01")
                .putAdditionalBodyProperty("fallbacks", JsonValue.from("default"));
        for (ChatMessageDto turn : turns) {
            if (turn.role() == ChatMessageDto.Role.user) params.addUserMessage(turn.content());
            else params.addAssistantMessage(turn.content());
        }

        BetaMessage response;
        try {
            response = client.beta().messages().create(params.build());
        } catch (RateLimitException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant is busy, please try again in a minute");
        } catch (AnthropicServiceException | AnthropicIoException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The assistant is unavailable right now");
        }

        boolean mk = "mk".equals(user.getLocale());
        if (response.stopReason().equals(Optional.of(BetaStopReason.REFUSAL))) {
            return mk ? "Не можам да помогнам со ова. Можам да ви помогнам со користење на апликацијата."
                      : "I can't help with that. I can help you with using the app.";
        }
        String text = response.content().stream()
                .flatMap(block -> block.text().stream())
                .map(BetaTextBlock::text)
                .collect(Collectors.joining("\n"))
                .strip();
        if (text.isEmpty()) {
            return mk ? "Извинете, не разбрав. Можете ли да кажете поинаку?" : "Sorry, I didn't catch that. Could you say it another way?";
        }
        return text;
    }

    /** The last MAX_HISTORY turns, starting at a user message as the API requires. */
    static List<ChatMessageDto> recent(List<ChatMessageDto> history) {
        int from = Math.max(0, history.size() - MAX_HISTORY);
        while (from < history.size() && history.get(from).role() != ChatMessageDto.Role.user) from++;
        return history.subList(from, history.size());
    }
}
