package com.runmyerrands.auth;

import com.runmyerrands.auth.dto.*;
import com.runmyerrands.config.JwtService;
import com.runmyerrands.user.User;
import com.runmyerrands.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName());
        user.setNeighbourhood(request.neighbourhood().trim());
        user.setPhone(request.phone());
        // Giver-only accounts don't post favors. The giver flag itself is only set once the giver
        // profile (categories + prices) is saved, since without prices nobody can be matched to them.
        user.setRequester(!"GIVER".equals(request.role()));
        userRepository.save(user);
        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return issueTokens(user);
    }

    private AuthResponse issueTokens(User user) {
        return new AuthResponse(jwtService.generateAccessToken(user.getEmail()),
                jwtService.generateRefreshToken(user.getEmail()), user.getId(), user.getDisplayName());
    }
}
