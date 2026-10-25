package com.runmyerrands.config;

import com.runmyerrands.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/**
 * Issues/validates JWTs. Subject is the user's email; "typ" keeps access and refresh tokens apart, and
 * "ver" must match User.tokenVersion, so bumping that (logout) revokes every token issued before.
 */
@Service
public class JwtService {

    public enum TokenType { ACCESS, REFRESH }

    private static final String TYPE_CLAIM = "typ";
    private static final String VERSION_CLAIM = "ver";

    @Value("${app.jwt.secret}")
    private String secret;
    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;
    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) { return build(user, TokenType.ACCESS, accessTokenExpirationMs); }
    public String generateRefreshToken(User user) { return build(user, TokenType.REFRESH, refreshTokenExpirationMs); }

    private String build(User user, TokenType type, long ttlMs) {
        Date now = new Date();
        return Jwts.builder().subject(user.getEmail())
                .claim(TYPE_CLAIM, type.name()).claim(VERSION_CLAIM, user.getTokenVersion())
                .issuedAt(now).expiration(new Date(now.getTime() + ttlMs)).signWith(key()).compact();
    }

    /** Signature, expiry and type checked; empty for anything else. The caller still checks the version. */
    public Optional<Claims> parse(String token, TokenType expectedType) {
        try {
            Claims claims = Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
            return expectedType.name().equals(claims.get(TYPE_CLAIM, String.class)) ? Optional.of(claims) : Optional.empty();
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public boolean matchesVersion(Claims claims, User user) {
        Integer ver = claims.get(VERSION_CLAIM, Integer.class);
        return ver != null && ver.equals(user.getTokenVersion());
    }
}
