package com.runmyerrands.offer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByFavorId(Long favorId);
    List<Offer> findByGiverIdOrderByCreatedAtDesc(Long giverId);
    long countByFavorIdAndStatus(Long favorId, Offer.Status status);

    /** Used when a favor is booked directly or cancelled: nobody can take up the remaining offers any more. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Offer o set o.status = :to where o.favorId = :favorId and o.status = :from")
    int updateStatusForFavor(@Param("favorId") Long favorId, @Param("from") Offer.Status from, @Param("to") Offer.Status to);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Offer o set o.status = :to where o.status = :from and o.createdAt < :cutoff")
    int updateStatusCreatedBefore(@Param("cutoff") Instant cutoff, @Param("from") Offer.Status from, @Param("to") Offer.Status to);
}
