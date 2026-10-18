package com.runmyerrands.booking.dto;

/** Only ever returned once a booking is CONFIRMED or later. */
public record ContactDto(String phone, String displayName) {}
