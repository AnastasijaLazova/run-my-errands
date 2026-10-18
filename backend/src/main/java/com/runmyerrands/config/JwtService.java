package com.runmyerrands.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

/** Issues/validates JWTs. Subject is the user's email. */
@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;
    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;
    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String email) { return build(email, accessTokenExpirationMs); }
    public String generateRefreshToken(String email) { return build(email, refreshTokenExpirationMs); }

    private String build(String subject, long ttlMs) {
        Date now = new Date();
        return Jwts.builder().subject(subject).issuedAt(now)
                .expiration(new Date(now.getTime() + ttlMs)).signWith(key()).compact();
    }

    public String extractEmail(String token) { return claim(token, Claims::getSubject); }
    public boolean isExpired(String token) { return claim(token, Claims::getExpiration).before(new Date()); }

    private <T> T claim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
        return resolver.apply(claims);
    }
}
