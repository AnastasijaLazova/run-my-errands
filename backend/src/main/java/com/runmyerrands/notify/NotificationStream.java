package com.runmyerrands.notify;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Open SSE connections per user (a user can have several tabs/devices). In-memory, so it only works with a
 * single backend instance; with several, pushes would need a shared channel (e.g. Postgres LISTEN/NOTIFY).
 */
@Component
public class NotificationStream {

    /** Connections end after this; the client reconnects, which also picks up a refreshed token. */
    private static final long TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    private final Map<Long, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(emitter);
        Runnable remove = () -> remove(userId, emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(e -> remove.run());
        // Flushes the response headers right away so the client knows it is connected.
        sendTo(userId, emitter, SseEmitter.event().name("ready").data("ok"));
        return emitter;
    }

    public void send(Long userId, Object payload) {
        for (SseEmitter emitter : emitters.getOrDefault(userId, Set.of())) {
            sendTo(userId, emitter, SseEmitter.event().name("notification").data(payload));
        }
    }

    /** Keeps idle connections from being cut by proxies, and notices dead ones. */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        emitters.forEach((userId, set) -> set.forEach(e -> sendTo(userId, e, SseEmitter.event().comment("ping"))));
    }

    private void sendTo(Long userId, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException e) {
            // The client went away.
            remove(userId, emitter);
            try { emitter.completeWithError(e); } catch (IllegalStateException ignored) { /* already completed */ }
        }
    }

    private void remove(Long userId, SseEmitter emitter) {
        emitters.computeIfPresent(userId, (k, set) -> {
            set.remove(emitter);
            return set.isEmpty() ? null : set;
        });
    }
}
