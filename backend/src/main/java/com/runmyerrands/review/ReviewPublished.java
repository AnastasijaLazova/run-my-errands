package com.runmyerrands.review;

/** Published (inside the transaction) when a blind review becomes visible to its target. */
public record ReviewPublished(Long reviewId) {}
