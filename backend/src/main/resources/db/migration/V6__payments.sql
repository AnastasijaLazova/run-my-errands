-- Simulated payments: no money moves, but the app keeps the same records a real escrow would.
-- The requester pays price + fee once a booking is confirmed; the money is HELD until the booking is
-- completed (RELEASED to the giver) or cancelled (REFUNDED, or PARTIALLY_REFUNDED on a late cancel).
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    requester_id BIGINT NOT NULL REFERENCES users(id),
    giver_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(10,2) NOT NULL,
    fee NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('HELD','RELEASED','REFUNDED','PARTIALLY_REFUNDED')),
    card_brand VARCHAR(20),
    card_last4 CHAR(4),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    giver_payout NUMERIC(10,2) NOT NULL DEFAULT 0,
    settled_at TIMESTAMPTZ
);
CREATE INDEX idx_payments_giver_settled ON payments(giver_id, settled_at);
CREATE INDEX idx_payments_requester_paid ON payments(requester_id, paid_at);

-- Bookings finished before payments existed count as paid and released, so dashboard totals don't drop.
INSERT INTO payments (booking_id, requester_id, giver_id, amount, fee, total, status, paid_at, giver_payout, settled_at)
SELECT b.id, b.requester_id, b.giver_id, b.price, ROUND(b.price * 0.10), b.price + ROUND(b.price * 0.10), 'RELEASED',
       COALESCE(b.responded_at, b.requested_at), b.price, COALESCE(b.completed_at, b.requested_at)
  FROM bookings b
 WHERE b.status IN ('COMPLETED','CLOSED') AND b.price IS NOT NULL;

-- Payment notifications carry the money involved ("refunded 250 MKD").
ALTER TABLE notifications ADD COLUMN amount NUMERIC(10,2);
