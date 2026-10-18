package com.runmyerrands.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GiverProfileRepository extends JpaRepository<GiverProfile, Long> {
    Optional<GiverProfile> findByUserId(Long userId);
}
