package com.runmyerrands.offer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByFavorId(Long favorId);
    List<Offer> findByGiverIdOrderByCreatedAtDesc(Long giverId);
}
