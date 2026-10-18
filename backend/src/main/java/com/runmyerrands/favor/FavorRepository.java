package com.runmyerrands.favor;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavorRepository extends JpaRepository<Favor, Long> {
    List<Favor> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    /** Row lock for the transaction — stops two simultaneous offer-acceptances both succeeding. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Favor f where f.id = :id")
    Optional<Favor> findByIdForUpdate(@Param("id") Long id);
}
