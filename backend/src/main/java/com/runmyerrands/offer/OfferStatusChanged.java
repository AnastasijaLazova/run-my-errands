package com.runmyerrands.offer;

/** Published (inside the transaction) when an offer is created or accepted/rejected/withdrawn one by one. */
public record OfferStatusChanged(Long offerId) {}
