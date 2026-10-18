-- Users: email + password login. phone is a profile field shown only after a booking is CONFIRMED.
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    display_name VARCHAR(120) NOT NULL DEFAULT '',
    avatar_url VARCHAR(500),
    locale VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (locale IN ('en','mk')),
    is_requester BOOLEAN NOT NULL DEFAULT TRUE,
    is_giver BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(60) NOT NULL UNIQUE,
    name_en VARCHAR(120) NOT NULL,
    name_mk VARCHAR(120) NOT NULL,
    trust_tier VARCHAR(20) NOT NULL CHECK (trust_tier IN ('LOW','MEDIUM','HIGH'))
);

INSERT INTO categories (key, name_en, name_mk, trust_tier) VALUES
 ('pet_care',       'Pet care (walk / feed / clean)', 'Нега на миленици',    'LOW'),
 ('bill_payment',   'Bill payment / errands',         'Плаќање сметки',      'HIGH'),
 ('pharmacy',       'Pharmacy pickup',                'Подигање лекови',     'MEDIUM'),
 ('yard_work',      'Yard work',                      'Дворни работи',       'LOW'),
 ('babysitting',    'Babysitting',                    'Чување деца',         'HIGH'),
 ('housework',      'Housework',                      'Домашни работи',      'MEDIUM'),
 ('shopping',       'Shopping',                       'Купување',            'LOW'),
 ('home_cooking',   'Home cooking',                   'Домашно готвење',     'MEDIUM'),
 ('cleaning',       'Cleaning',                       'Чистење',             'MEDIUM'),
 ('tutoring',       'Tutoring / mentoring',           'Учење / менторство',  'MEDIUM'),
 ('vehicle_repair', 'Car / bike repair',              'Поправка на возила',  'LOW'),
 ('it_fixes',       'IT / network fixes',             'IT поправки',         'LOW'),
 ('laundry',        'Laundry drop-off',               'Перална',             'LOW');

CREATE TABLE giver_profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_km DOUBLE PRECISION NOT NULL DEFAULT 10,
    availability VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE giver_categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES giver_profiles(user_id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    price NUMERIC(10,2) NOT NULL,
    UNIQUE (user_id, category_id)
);

CREATE TABLE favors (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id),
    category_id BIGINT NOT NULL REFERENCES categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address_text VARCHAR(255),
    when_type VARCHAR(10) NOT NULL DEFAULT 'ASAP' CHECK (when_type IN ('ASAP','SCHEDULED')),
    when_at TIMESTAMPTZ,
    budget NUMERIC(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','BOOKED','CLOSED','CANCELLED')),
    visibility VARCHAR(20) NOT NULL DEFAULT 'OPEN_BOARD' CHECK (visibility IN ('OPEN_BOARD','DIRECT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_favors_status_category ON favors(status, category_id);

CREATE TABLE offers (
    id BIGSERIAL PRIMARY KEY,
    favor_id BIGINT NOT NULL REFERENCES favors(id) ON DELETE CASCADE,
    giver_id BIGINT NOT NULL REFERENCES users(id),
    message TEXT,
    proposed_price NUMERIC(10,2),
    proposed_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN','EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_offer_pending_per_giver ON offers(favor_id, giver_id) WHERE status = 'PENDING';

CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    favor_id BIGINT NOT NULL REFERENCES favors(id),
    requester_id BIGINT NOT NULL REFERENCES users(id),
    giver_id BIGINT NOT NULL REFERENCES users(id),
    origin VARCHAR(20) NOT NULL CHECK (origin IN ('DIRECT_REQUEST','GIVER_OFFER')),
    offer_id BIGINT REFERENCES offers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED','CONFIRMED','DECLINED','CANCELLED','EXPIRED','COMPLETED','CLOSED')),
    note TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancel_reason VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_bookings_giver_status ON bookings(giver_id, status);
CREATE INDEX idx_bookings_requester_status ON bookings(requester_id, status);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id),
    author_id BIGINT NOT NULL REFERENCES users(id),
    target_id BIGINT NOT NULL REFERENCES users(id),
    stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    text TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ,
    UNIQUE (booking_id, author_id)
);
