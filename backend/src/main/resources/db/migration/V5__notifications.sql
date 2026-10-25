-- In-app notifications. Typed columns (not a JSON blob): the frontend builds the sentence per type and
-- language, and actor_name / favor_title are snapshots so the list renders without joins.
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE,
    offer_id BIGINT REFERENCES offers(id) ON DELETE CASCADE,
    favor_id BIGINT REFERENCES favors(id) ON DELETE CASCADE,
    actor_name VARCHAR(120),
    favor_title VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
