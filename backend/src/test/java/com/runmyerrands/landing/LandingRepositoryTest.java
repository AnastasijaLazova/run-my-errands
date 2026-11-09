package com.runmyerrands.landing;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LandingRepositoryTest {

    @Test
    void shortNameKeepsFirstNameAndLastInitial() {
        assertEquals("Maja A.", LandingRepository.shortName("Maja Andova"));
        assertEquals("Ana S.", LandingRepository.shortName("  Ana  Marija   Stojanova "));
    }

    @Test
    void shortNameHandlesSingleAndEmptyNames() {
        assertEquals("Bojan", LandingRepository.shortName("Bojan"));
        assertEquals("", LandingRepository.shortName(""));
        assertEquals("", LandingRepository.shortName(null));
    }
}
