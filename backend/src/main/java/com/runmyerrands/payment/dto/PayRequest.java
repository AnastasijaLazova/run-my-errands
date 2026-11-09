package com.runmyerrands.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Fake card details. Checked for shape only, never stored beyond brand and last four digits. */
public record PayRequest(
        @NotBlank @Pattern(regexp = "^[0-9 ]{16,19}$", message = "Card number must have 16 digits") String cardNumber,
        @NotBlank @Pattern(regexp = "^(0[1-9]|1[0-2])/\\d{2}$", message = "Use MM/YY") String expiry,
        @NotBlank @Pattern(regexp = "^\\d{3,4}$", message = "3 or 4 digits") String cvc,
        @NotBlank String holderName) {}
