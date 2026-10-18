package com.runmyerrands.offer;

import com.runmyerrands.booking.Booking;
import com.runmyerrands.booking.BookingService;
import com.runmyerrands.booking.dto.BookingDto;
import com.runmyerrands.favor.Favor;
import com.runmyerrands.favor.FavorRepository;
import com.runmyerrands.offer.dto.CreateOfferRequest;
import com.runmyerrands.offer.dto.OfferDto;
import com.runmyerrands.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OfferService {

    private static final int MAX_OFFERS_PER_FAVOR = 10;

    private final OfferRepository offerRepository;
    private final FavorRepository favorRepository;
    private final BookingService bookingService;

    @Transactional
    public OfferDto create(User giver, Long favorId, CreateOfferRequest request) {
        Favor favor = favorRepository.findById(favorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favor not found"));
        if (favor.getRequesterId().equals(giver.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can't offer on your own favor");
        }
        if (favor.getStatus() != Favor.Status.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This favor is no longer open");
        }
        if (offerRepository.findByFavorId(favorId).size() >= MAX_OFFERS_PER_FAVOR) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This favor already has the maximum number of offers");
        }

        Offer offer = new Offer();
        offer.setFavorId(favorId);
        offer.setGiverId(giver.getId());
        offer.setMessage(request.message());
        offer.setProposedPrice(request.proposedPrice());
        offer.setProposedTime(request.proposedTime());
        try {
            return OfferDto.from(offerRepository.saveAndFlush(offer));
        } catch (DataIntegrityViolationException e) {
            // partial unique index: one PENDING offer per (favor, giver)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending offer on this favor");
        }
    }

    /** Only the favor's owner may list the offers on it. */
    @Transactional(readOnly = true)
    public List<OfferDto> forFavor(Long favorId, User requester) {
        Favor favor = favorRepository.findById(favorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favor not found"));
        if (!favor.getRequesterId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your favor");
        }
        return offerRepository.findByFavorId(favorId).stream().map(OfferDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OfferDto> mine(Long giverId) {
        return offerRepository.findByGiverIdOrderByCreatedAtDesc(giverId).stream().map(OfferDto::from).toList();
    }

    /**
     * Accept = one transaction: lock the favor, mark this offer ACCEPTED and all other PENDING offers
     * REJECTED, flip the favor to BOOKED, create a Booking that starts CONFIRMED (both sides agreed).
     */
    @Transactional
    public BookingDto accept(Long offerId, User requester) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));
        Favor favor = favorRepository.findByIdForUpdate(offer.getFavorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favor not found"));

        if (!favor.getRequesterId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your favor");
        }
        if (favor.getStatus() != Favor.Status.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This favor is no longer open");
        }
        if (offer.getStatus() != Offer.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This offer is no longer pending");
        }

        for (Offer other : offerRepository.findByFavorId(favor.getId())) {
            if (other.getId().equals(offer.getId())) {
                other.setStatus(Offer.Status.ACCEPTED);
            } else if (other.getStatus() == Offer.Status.PENDING) {
                other.setStatus(Offer.Status.REJECTED);
            }
            offerRepository.save(other);
        }
        favor.setStatus(Favor.Status.BOOKED);
        favorRepository.save(favor);

        Booking booking = bookingService.createFromAcceptedOffer(
                favor.getId(), requester.getId(), offer.getGiverId(), offer.getId(),
                offer.getProposedPrice() != null ? offer.getProposedPrice() : favor.getBudget());
        return BookingDto.from(booking);
    }

    @Transactional
    public OfferDto reject(Long offerId, User requester) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));
        Favor favor = favorRepository.findById(offer.getFavorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favor not found"));
        if (!favor.getRequesterId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your favor");
        }
        if (offer.getStatus() != Offer.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This offer is no longer pending");
        }
        offer.setStatus(Offer.Status.REJECTED);
        return OfferDto.from(offerRepository.save(offer));
    }

    @Transactional
    public OfferDto withdraw(Long offerId, User giver) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));
        if (!offer.getGiverId().equals(giver.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your offer");
        }
        if (offer.getStatus() != Offer.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This offer is no longer pending");
        }
        offer.setStatus(Offer.Status.WITHDRAWN);
        return OfferDto.from(offerRepository.save(offer));
    }
}
