-- The agreed price lives on the booking so "spent this month" can be summed without re-deriving it.
ALTER TABLE bookings ADD COLUMN price NUMERIC(10,2);

UPDATE bookings b SET price = COALESCE(
    (SELECT o.proposed_price FROM offers o WHERE o.id = b.offer_id),
    (SELECT gc.price FROM giver_categories gc JOIN favors f ON f.category_id = gc.category_id
      WHERE f.id = b.favor_id AND gc.user_id = b.giver_id),
    (SELECT f.budget FROM favors f WHERE f.id = b.favor_id));

-- Reviews are two-way, so requesters get a rating too (givers keep theirs on giver_profiles).
ALTER TABLE users
    ADD COLUMN requester_rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
    ADD COLUMN requester_rating_count INTEGER NOT NULL DEFAULT 0;

UPDATE users u SET requester_rating_count = s.cnt, requester_rating_avg = s.avg
FROM (SELECT r.target_id, COUNT(*) AS cnt, ROUND(AVG(r.stars), 2) AS avg
        FROM reviews r JOIN bookings b ON b.id = r.booking_id
       WHERE r.published_at IS NOT NULL AND r.target_id = b.requester_id
       GROUP BY r.target_id) s
WHERE u.id = s.target_id;
