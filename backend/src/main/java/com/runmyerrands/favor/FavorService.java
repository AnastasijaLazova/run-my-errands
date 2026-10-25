package com.runmyerrands.favor;

import com.runmyerrands.category.Category;
import com.runmyerrands.category.CategoryRepository;
import com.runmyerrands.favor.dto.*;
import com.runmyerrands.offer.Offer;
import com.runmyerrands.offer.OfferRepository;
import com.runmyerrands.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavorService {

    private static final double PRICE_TOLERANCE_PCT = 0.25; // "±25%" as in the prototype

    private final FavorRepository favorRepository;
    private final CategoryRepository categoryRepository;
    private final MatchingRepository matchingRepository;
    private final OfferRepository offerRepository;

    @Transactional
    public FavorDto create(User requester, CreateFavorRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category"));

        Favor favor = new Favor();
        favor.setRequesterId(requester.getId());
        favor.setCategory(category);
        favor.setTitle(request.title());
        favor.setDescription(request.description());
        // Defaults to where the requester lives; they can override it when the errand is somewhere else.
        boolean hasOwn = request.neighbourhood() != null && !request.neighbourhood().isBlank();
        favor.setNeighbourhood(hasOwn ? request.neighbourhood().trim() : requester.getNeighbourhood());
        favor.setBudget(request.budget());
        favor.setWhenAt(request.whenAt());
        if (request.whenType() != null) favor.setWhenType(parseWhenType(request.whenType()));
        return FavorDto.from(favorRepository.save(favor));
    }

    /** Only the owner, and only while OPEN — once booked, the other side has agreed to what was posted. */
    @Transactional
    public FavorDto update(Long id, User requester, UpdateFavorRequest request) {
        Favor favor = findOwnedOpenForUpdate(id, requester, "edit");
        if (request.title() != null) favor.setTitle(request.title().trim());
        if (request.description() != null) favor.setDescription(request.description());
        if (request.neighbourhood() != null && !request.neighbourhood().isBlank()) favor.setNeighbourhood(request.neighbourhood().trim());
        if (request.budget() != null) favor.setBudget(request.budget());
        if (request.whenType() != null) {
            Favor.WhenType whenType = parseWhenType(request.whenType());
            favor.setWhenType(whenType);
            if (whenType == Favor.WhenType.ASAP) favor.setWhenAt(null);
        }
        if (request.whenAt() != null) favor.setWhenAt(request.whenAt());
        return FavorDto.from(favorRepository.save(favor));
    }

    /** Soft delete: the favor becomes CANCELLED and its pending offers expire. A booked favor needs its booking cancelled first. */
    @Transactional
    public void cancel(Long id, User requester) {
        Favor favor = findOwnedOpenForUpdate(id, requester, "cancel");
        favor.setStatus(Favor.Status.CANCELLED);
        favorRepository.save(favor);
        offerRepository.updateStatusForFavor(id, Offer.Status.PENDING, Offer.Status.EXPIRED);
    }

    @Transactional(readOnly = true)
    public List<FavorDto> mine(Long requesterId) {
        return favorRepository.findByRequesterIdOrderByCreatedAtDesc(requesterId).stream().map(FavorDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FavorDto> open(Long categoryId) {
        return favorRepository.findAll().stream()
                .filter(f -> f.getStatus() == Favor.Status.OPEN)
                .filter(f -> categoryId == null || f.getCategory().getId().equals(categoryId))
                .map(FavorDto::from).toList();
    }

    @Transactional(readOnly = true)
    public FavorDto get(Long id) {
        return FavorDto.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<GiverMatchDto> findMatches(Long favorId, String sort) {
        Favor favor = findOrThrow(favorId);
        return matchingRepository.findMatches(favor.getCategory().getId(), favor.getRequesterId(),
                favor.getBudget(), PRICE_TOLERANCE_PCT, sort);
    }

    /** Same filter as findMatches — used for the "N matches" count on the dashboard. */
    @Transactional(readOnly = true)
    public int countMatches(Favor favor) {
        return matchingRepository.findMatches(favor.getCategory().getId(), favor.getRequesterId(),
                favor.getBudget(), PRICE_TOLERANCE_PCT, null).size();
    }

    private Favor findOwnedOpenForUpdate(Long id, User requester, String action) {
        Favor favor = favorRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favor not found"));
        if (!favor.getRequesterId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your favor");
        }
        if (favor.getStatus() != Favor.Status.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, favor.getStatus() == Favor.Status.BOOKED
                    ? "This favor is booked; cancel the booking first"
                    : "Only open favors can be changed");
        }
        return favor;
    }

    private static Favor.WhenType parseWhenType(String value) {
        try {
            return Favor.WhenType.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown whenType: " + value);
        }
    }

    private Favor findOrThrow(Long id) {
        return favorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favor not found"));
    }
}
