package com.runmyerrands.payment;

import com.runmyerrands.booking.Booking;
import com.runmyerrands.booking.BookingRepository;
import com.runmyerrands.booking.BookingStatusChanged;
import com.runmyerrands.favor.Favor;
import com.runmyerrands.favor.FavorRepository;
import com.runmyerrands.payment.dto.CancelPreviewDto;
import com.runmyerrands.payment.dto.PayRequest;
import com.runmyerrands.payment.dto.PaymentDto;
import com.runmyerrands.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;

/** Simulated escrow: the requester pays once a booking is confirmed; the money is settled when it ends. */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final ZoneId SKOPJE = ZoneId.of("Europe/Skopje");
    /** Demo rule so a failed payment can be shown: any card ending in 0000 is declined. */
    private static final String DECLINED_SUFFIX = "0000";

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final FavorRepository favorRepository;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public PaymentDto get(Long bookingId, User user) {
        Booking b = participantBooking(bookingId, user);
        return paymentRepository.findByBookingId(bookingId)
                .map(p -> PaymentDto.from(p, freeUntil(p, b)))
                .orElseGet(() -> PaymentDto.quote(b.getId(), price(b), CancellationPolicy.fee(price(b))));
    }

    @Transactional
    public PaymentDto pay(Long bookingId, User user, PayRequest card) {
        Booking b = participantBooking(bookingId, user);
        if (!b.getRequesterId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the requester pays for a booking");
        }
        if (b.getStatus() != Booking.Status.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a confirmed booking can be paid");
        }
        if (paymentRepository.findByBookingId(bookingId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking is already paid");
        }
        String number = card.cardNumber().replace(" ", "");
        checkCard(number, card.expiry());

        BigDecimal amount = price(b);
        BigDecimal fee = CancellationPolicy.fee(amount);
        Payment p = new Payment();
        p.setBookingId(b.getId());
        p.setRequesterId(b.getRequesterId());
        p.setGiverId(b.getGiverId());
        p.setAmount(amount);
        p.setFee(fee);
        p.setTotal(amount.add(fee));
        p.setCardBrand(brand(number));
        p.setCardLast4(number.substring(number.length() - 4));
        paymentRepository.save(p);
        events.publishEvent(new PaymentChanged(p.getId()));
        return PaymentDto.from(p, freeUntil(p, b));
    }

    @Transactional(readOnly = true)
    public CancelPreviewDto cancelPreview(Long bookingId, User user) {
        Booking b = participantBooking(bookingId, user);
        return paymentRepository.findByBookingId(bookingId)
                .filter(p -> p.getStatus() == Payment.Status.HELD)
                .map(p -> {
                    boolean byRequester = b.getRequesterId().equals(user.getId());
                    Instant freeUntil = freeUntil(p, b);
                    CancellationPolicy.Outcome o = CancellationPolicy.onCancel(p.getAmount(), p.getFee(), byRequester,
                            freeUntil, Instant.now());
                    return new CancelPreviewDto(true, o.refund(), o.giverPayout(), o.free(), byRequester ? freeUntil : null);
                })
                .orElse(new CancelPreviewDto(false, BigDecimal.ZERO, BigDecimal.ZERO, true, null));
    }

    /** Settles held money when its booking ends. Runs in the booking's transaction, so both commit together. */
    @EventListener
    public void on(BookingStatusChanged event) {
        Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
        if (b == null || (b.getStatus() != Booking.Status.COMPLETED && b.getStatus() != Booking.Status.CANCELLED)) return;
        paymentRepository.findByBookingId(b.getId()).filter(p -> p.getStatus() == Payment.Status.HELD).ifPresent(p -> {
            if (b.getStatus() == Booking.Status.COMPLETED) {
                p.setStatus(Payment.Status.RELEASED);
                p.setGiverPayout(p.getAmount());
            } else {
                CancellationPolicy.Outcome o = CancellationPolicy.onCancel(p.getAmount(), p.getFee(),
                        b.getRequesterId().equals(event.actorId()), freeUntil(p, b), Instant.now());
                p.setRefundAmount(o.refund());
                p.setGiverPayout(o.giverPayout());
                p.setStatus(o.giverPayout().signum() > 0 ? Payment.Status.PARTIALLY_REFUNDED : Payment.Status.REFUNDED);
            }
            p.setSettledAt(Instant.now());
            paymentRepository.save(p);
            events.publishEvent(new PaymentChanged(p.getId()));
        });
    }

    private void checkCard(String number, String expiry) {
        if (number.length() != 16) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Card number must have 16 digits");
        }
        String[] mmyy = expiry.split("/");
        YearMonth expires = YearMonth.of(2000 + Integer.parseInt(mmyy[1]), Integer.parseInt(mmyy[0]));
        if (expires.isBefore(YearMonth.now(SKOPJE))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This card has expired");
        }
        if (number.endsWith(DECLINED_SUFFIX)) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Card declined. Try a different card.");
        }
    }

    private static String brand(String number) {
        return switch (number.charAt(0)) {
            case '4' -> "VISA";
            case '5' -> "MASTERCARD";
            case '3' -> "AMEX";
            default -> "CARD";
        };
    }

    private Instant freeUntil(Payment p, Booking b) {
        Favor f = favorRepository.findById(b.getFavorId()).orElse(null);
        return CancellationPolicy.freeUntil(p.getPaidAt(),
                f != null ? f.getWhenType() : Favor.WhenType.ASAP, f != null ? f.getWhenAt() : null);
    }

    private static BigDecimal price(Booking b) {
        if (b.getPrice() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking has no agreed price");
        }
        return b.getPrice();
    }

    private Booking participantBooking(Long bookingId, User user) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (!b.getRequesterId().equals(user.getId()) && !b.getGiverId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant on this booking");
        }
        return b;
    }
}
