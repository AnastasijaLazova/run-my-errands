-- Demo data: 10 users (all @demo.mk, password P@ssword123$) with closed, completed, confirmed, requested and
-- cancelled bookings, open favors with pending offers, payments, reviews and notifications.
-- Not a Flyway migration on purpose. Re-runnable: it first deletes everything belonging to @demo.mk users.
--   psql -h localhost -U rme -d run_my_errands -f scripts/seed-demo-data.sql

BEGIN;

-- ---------- cleanup ----------
CREATE TEMP TABLE demo_users ON COMMIT DROP AS SELECT id FROM users WHERE email LIKE '%@demo.mk';
DELETE FROM notifications WHERE user_id IN (SELECT id FROM demo_users);
DELETE FROM payments WHERE requester_id IN (SELECT id FROM demo_users) OR giver_id IN (SELECT id FROM demo_users);
DELETE FROM reviews WHERE author_id IN (SELECT id FROM demo_users) OR target_id IN (SELECT id FROM demo_users);
DELETE FROM bookings WHERE requester_id IN (SELECT id FROM demo_users) OR giver_id IN (SELECT id FROM demo_users);
DELETE FROM offers WHERE giver_id IN (SELECT id FROM demo_users)
   OR favor_id IN (SELECT id FROM favors WHERE requester_id IN (SELECT id FROM demo_users));
DELETE FROM favors WHERE requester_id IN (SELECT id FROM demo_users);
DELETE FROM users WHERE id IN (SELECT id FROM demo_users); -- cascades to giver_profiles / giver_categories

-- ---------- helpers (session-only) ----------
CREATE FUNCTION pg_temp.cat(k text) RETURNS bigint LANGUAGE sql AS $f$ SELECT id FROM categories WHERE key = k $f$;

CREATE FUNCTION pg_temp.usr(mail text, name text, hood text, phone text, giver boolean, created timestamptz)
RETURNS bigint LANGUAGE sql AS $f$
  INSERT INTO users (email, password_hash, phone, display_name, locale, is_requester, is_giver, neighbourhood, created_at)
  VALUES (mail, '$2a$10$5It5FsnR6BoLuj0JpHLdGOxA3H75Rmk7HQgQsWBM4E0/MSEi7TUZ6', phone, name, 'en', TRUE, giver, hood, created)
  RETURNING id
$f$;

CREATE FUNCTION pg_temp.favor(req bigint, k text, t text, d text, hood text, wtype text, wat timestamptz,
                              budget numeric, st text, vis text, created timestamptz)
RETURNS bigint LANGUAGE sql AS $f$
  INSERT INTO favors (requester_id, category_id, title, description, neighbourhood, when_type, when_at, budget, status, visibility, created_at)
  VALUES (req, pg_temp.cat(k), t, d, hood, wtype, wat, budget, st, vis, created)
  RETURNING id
$f$;

CREATE FUNCTION pg_temp.offer(fav bigint, giver bigint, msg text, price numeric, st text, created timestamptz)
RETURNS bigint LANGUAGE sql AS $f$
  INSERT INTO offers (favor_id, giver_id, message, proposed_price, status, created_at)
  VALUES (fav, giver, msg, price, st, created)
  RETURNING id
$f$;

CREATE FUNCTION pg_temp.booking(fav bigint, giver bigint, orig text, off bigint, st text, price numeric, note text,
                                requested timestamptz, responded timestamptz, completed timestamptz)
RETURNS bigint LANGUAGE sql AS $f$
  INSERT INTO bookings (favor_id, requester_id, giver_id, origin, offer_id, status, price, note, requested_at, responded_at, completed_at)
  SELECT fav, f.requester_id, giver, orig, off, st, price, note, requested, responded, completed FROM favors f WHERE f.id = fav
  RETURNING id
$f$;

-- Price + 10% fee, mirroring CancellationPolicy. RELEASED pays the giver; REFUNDED returns everything.
CREATE FUNCTION pg_temp.pay(bk bigint, st text, card text, last4 text, paid timestamptz, settled timestamptz)
RETURNS void LANGUAGE sql AS $f$
  INSERT INTO payments (booking_id, requester_id, giver_id, amount, fee, total, status, card_brand, card_last4,
                        paid_at, refund_amount, giver_payout, settled_at)
  SELECT b.id, b.requester_id, b.giver_id, b.price, ROUND(b.price * 0.10), b.price + ROUND(b.price * 0.10), st, card, last4,
         paid,
         CASE WHEN st = 'REFUNDED' THEN b.price + ROUND(b.price * 0.10) ELSE 0 END,
         CASE WHEN st = 'RELEASED' THEN b.price ELSE 0 END,
         settled
    FROM bookings b WHERE b.id = bk
$f$;

CREATE FUNCTION pg_temp.review(bk bigint, author bigint, target bigint, stars int, txt text,
                               submitted timestamptz, published timestamptz)
RETURNS void LANGUAGE sql AS $f$
  INSERT INTO reviews (booking_id, author_id, target_id, stars, text, submitted_at, published_at)
  VALUES (bk, author, target, stars, txt, submitted, published)
$f$;

CREATE FUNCTION pg_temp.notify(recipient bigint, typ text, bk bigint, off bigint, fav bigint, actor bigint,
                               created timestamptz, is_read boolean, amt numeric DEFAULT NULL)
RETURNS void LANGUAGE sql AS $f$
  INSERT INTO notifications (user_id, type, booking_id, offer_id, favor_id, actor_name, favor_title, created_at, read_at, amount)
  SELECT recipient, typ, bk, off, fav, (SELECT display_name FROM users WHERE id = actor),
         (SELECT title FROM favors WHERE id = fav), created, CASE WHEN is_read THEN created + interval '1 hour' END, amt
$f$;

-- ---------- scenarios ----------
DO $$
DECLARE
  ana bigint; petar bigint; elena bigint; goran bigint; ivana bigint;          -- mostly requesters
  stefan bigint; marija bigint; nikola bigint; teodora bigint; aleks bigint;   -- givers
  f bigint; o bigint; o2 bigint; b bigint;
BEGIN
  ana     := pg_temp.usr('ana@demo.mk',        'Ana Trajkovska',      'Центар',        '070 111 201', FALSE, now() - interval '60 days');
  petar   := pg_temp.usr('petar@demo.mk',      'Petar Nikolovski',    'Аеродром',      '070 111 202', FALSE, now() - interval '55 days');
  elena   := pg_temp.usr('elena@demo.mk',      'Elena Stojanovska',   'Карпош 2',      '070 111 203', TRUE,  now() - interval '50 days');
  goran   := pg_temp.usr('goran@demo.mk',      'Goran Dimitrov',      'Кисела Вода',   '070 111 204', FALSE, now() - interval '45 days');
  ivana   := pg_temp.usr('ivana@demo.mk',      'Ivana Kostova',       'Тафталиџе 2',   '070 111 205', FALSE, now() - interval '40 days');
  stefan  := pg_temp.usr('stefan@demo.mk',     'Stefan Angelov',      'Карпош 3',      '071 222 301', TRUE,  now() - interval '58 days');
  marija  := pg_temp.usr('marija@demo.mk',     'Marija Jovanovska',   'Центар',        '071 222 302', TRUE,  now() - interval '57 days');
  nikola  := pg_temp.usr('nikola@demo.mk',     'Nikola Ristov',       'Аеродром',      '071 222 303', TRUE,  now() - interval '52 days');
  teodora := pg_temp.usr('teodora@demo.mk',    'Teodora Ilievska',    'Дебар Маало',   '071 222 304', TRUE,  now() - interval '48 days');
  aleks   := pg_temp.usr('aleksandar@demo.mk', 'Aleksandar Petkov',   'Гази Баба',     '071 222 305', TRUE,  now() - interval '46 days');

  -- Giver profiles and what each one offers (MKD).
  INSERT INTO giver_profiles (user_id, bio, availability, verified) VALUES
    (stefan,  'Dog person with a big yard of my own. Happy to walk, feed or garden around Karposh.', 'Weekdays after 16h, weekends', TRUE),
    (marija,  'Tidy, fast and I love cooking for big families. Own cleaning supplies.',             'Mon–Sat, 8–18h',               TRUE),
    (nikola,  'Network engineer by day. Routers, laptops, bikes — I fix things.',                   'Evenings and weekends',        FALSE),
    (teodora, 'Pedagogy student, first-aid certified. Kids, homework and pharmacy runs.',           'Afternoons, Fri/Sat evenings', TRUE),
    (aleks,   'Have a car, know every shop and post office in town.',                               'Any day, 9–20h',               FALSE),
    (elena,   'Math teacher, glad to help students before exams.',                                  'Weekday evenings',             TRUE);
  INSERT INTO giver_categories (user_id, category_id, price) VALUES
    (stefan,  pg_temp.cat('pet_care'),       400), (stefan,  pg_temp.cat('yard_work'),    1200), (stefan, pg_temp.cat('shopping'), 450),
    (marija,  pg_temp.cat('cleaning'),       1500), (marija, pg_temp.cat('housework'),    1000),
    (marija,  pg_temp.cat('home_cooking'),   2000), (marija, pg_temp.cat('laundry'),       350),
    (nikola,  pg_temp.cat('it_fixes'),       800), (nikola,  pg_temp.cat('vehicle_repair'), 600),
    (teodora, pg_temp.cat('babysitting'),    1200), (teodora, pg_temp.cat('tutoring'),      600), (teodora, pg_temp.cat('pharmacy'), 300),
    (aleks,   pg_temp.cat('shopping'),       500), (aleks,   pg_temp.cat('bill_payment'),  250), (aleks,  pg_temp.cat('pharmacy'), 300),
    (elena,   pg_temp.cat('tutoring'),       700);

  -- ===== CLOSED (finished > 7 days ago, both reviews published) =====
  -- Ana -> Stefan: dog walking, booked from Stefan's offer
  f := pg_temp.favor(ana, 'pet_care', 'Walk my dog Bobi for a week', 'Bobi is a friendly 4-year-old beagle. Two walks a day, ~30 min each.',
                     'Центар', 'SCHEDULED', now() - interval '25 days', 450, 'CLOSED', 'OPEN_BOARD', now() - interval '28 days');
  o := pg_temp.offer(f, stefan, 'I walk dogs in Gradski Park every day, Bobi can join us!', 400, 'ACCEPTED', now() - interval '27 days');
  b := pg_temp.booking(f, stefan, 'GIVER_OFFER', o, 'CLOSED', 400, NULL, now() - interval '27 days', now() - interval '27 days', now() - interval '20 days');
  PERFORM pg_temp.pay(b, 'RELEASED', 'VISA', '4242', now() - interval '27 days', now() - interval '20 days');
  PERFORM pg_temp.review(b, ana, stefan, 5, 'Bobi came back happy and tired every day. Will book again!', now() - interval '19 days', now() - interval '19 days');
  PERFORM pg_temp.review(b, stefan, ana, 5, 'Clear instructions, keys ready on time. Lovely dog.', now() - interval '19 days', now() - interval '19 days');

  -- Petar -> Nikola: Wi-Fi fix, direct request
  f := pg_temp.favor(petar, 'it_fixes', 'Wi-Fi keeps dropping in the bedroom', 'Router is in the hallway, signal dies in the back rooms. Maybe a repeater?',
                     'Аеродром', 'ASAP', NULL, 1000, 'CLOSED', 'OPEN_BOARD', now() - interval '15 days');
  b := pg_temp.booking(f, nikola, 'DIRECT_REQUEST', NULL, 'CLOSED', 800, 'Evenings after 18h work best for me.',
                       now() - interval '15 days', now() - interval '14 days', now() - interval '12 days');
  PERFORM pg_temp.pay(b, 'RELEASED', 'MASTERCARD', '5100', now() - interval '14 days', now() - interval '12 days');
  PERFORM pg_temp.review(b, petar, nikola, 5, 'Set up a mesh system, explained everything. Full signal everywhere now.', now() - interval '11 days', now() - interval '10 days');
  PERFORM pg_temp.review(b, nikola, petar, 4, 'Friendly, had coffee ready. Was a bit late letting me in.', now() - interval '10 days', now() - interval '10 days');

  -- Ivana -> Teodora: pharmacy pickup
  f := pg_temp.favor(ivana, 'pharmacy', 'Pick up my grandmother''s prescription', 'Zegin pharmacy near City Mall, prescription is under Vera Kostova.',
                     'Тафталиџе 2', 'ASAP', NULL, 300, 'CLOSED', 'OPEN_BOARD', now() - interval '10 days');
  b := pg_temp.booking(f, teodora, 'DIRECT_REQUEST', NULL, 'CLOSED', 300, NULL, now() - interval '10 days', now() - interval '10 days', now() - interval '9 days');
  PERFORM pg_temp.pay(b, 'RELEASED', 'VISA', '4000', now() - interval '10 days', now() - interval '9 days');
  PERFORM pg_temp.review(b, ivana, teodora, 5, 'Super quick and so kind to my grandma.', now() - interval '9 days', now() - interval '9 days');
  PERFORM pg_temp.review(b, teodora, ivana, 5, 'Easy and well organised, thank you!', now() - interval '9 days', now() - interval '9 days');

  -- Elena -> Stefan: yard work
  f := pg_temp.favor(elena, 'yard_work', 'Rake leaves and trim the hedge', 'Small front yard, around 40 m². Tools are in the shed.',
                     'Карпош 2', 'SCHEDULED', now() - interval '16 days', 1300, 'CLOSED', 'OPEN_BOARD', now() - interval '19 days');
  b := pg_temp.booking(f, stefan, 'DIRECT_REQUEST', NULL, 'CLOSED', 1200, 'Saturday morning if possible.',
                       now() - interval '18 days', now() - interval '18 days', now() - interval '15 days');
  PERFORM pg_temp.pay(b, 'RELEASED', 'VISA', '4111', now() - interval '18 days', now() - interval '15 days');
  PERFORM pg_temp.review(b, elena, stefan, 4, 'Good job on the hedge, left a few leaves behind the garage.', now() - interval '14 days', now() - interval '14 days');
  PERFORM pg_temp.review(b, stefan, elena, 5, 'Great host, even made lunch.', now() - interval '15 days', now() - interval '14 days');

  -- ===== COMPLETED (inside the 7-day review window) =====
  -- Ana -> Aleksandar: bill payment, both reviewed (published)
  f := pg_temp.favor(ana, 'bill_payment', 'Pay electricity and water bills', 'EVN and Vodovod bills, I''ll leave cash and the slips with the doorman.',
                     'Центар', 'ASAP', NULL, 250, 'CLOSED', 'OPEN_BOARD', now() - interval '7 days');
  b := pg_temp.booking(f, aleks, 'DIRECT_REQUEST', NULL, 'COMPLETED', 250, NULL, now() - interval '7 days', now() - interval '7 days', now() - interval '5 days');
  PERFORM pg_temp.pay(b, 'RELEASED', 'VISA', '4242', now() - interval '7 days', now() - interval '5 days');
  PERFORM pg_temp.review(b, ana, aleks, 5, 'Sent photos of the receipts straight away. Reliable!', now() - interval '4 days', now() - interval '4 days');
  PERFORM pg_temp.review(b, aleks, ana, 5, 'Everything was ready, quick handover.', now() - interval '4 days', now() - interval '4 days');
  PERFORM pg_temp.notify(aleks, 'REVIEW_RECEIVED', b, NULL, f, ana, now() - interval '4 days', FALSE);

  -- Goran -> Marija: deep clean, only Marija has reviewed so far (hidden until Goran rates)
  f := pg_temp.favor(goran, 'cleaning', 'Deep clean before moving out', 'Two-bedroom apartment, kitchen and bathroom need the most work.',
                     'Кисела Вода', 'SCHEDULED', now() - interval '2 days', 1600, 'CLOSED', 'OPEN_BOARD', now() - interval '6 days');
  o := pg_temp.offer(f, marija, 'I can bring a steam cleaner for the bathroom. Done in ~5 hours.', 1500, 'ACCEPTED', now() - interval '5 days');
  b := pg_temp.booking(f, marija, 'GIVER_OFFER', o, 'COMPLETED', 1500, NULL, now() - interval '5 days', now() - interval '5 days', now() - interval '2 days');
  PERFORM pg_temp.pay(b, 'RELEASED', 'MASTERCARD', '5555', now() - interval '5 days', now() - interval '2 days');
  PERFORM pg_temp.review(b, marija, goran, 5, 'Apartment was empty and easy to work in. Paid promptly.', now() - interval '1 day', NULL);
  PERFORM pg_temp.notify(goran, 'BOOKING_COMPLETED', b, o, f, marija, now() - interval '2 days', FALSE);
  PERFORM pg_temp.notify(marija, 'PAYOUT_RELEASED', b, o, f, goran, now() - interval '2 days', TRUE, 1500);

  -- ===== CONFIRMED (in progress, money held) =====
  -- Ivana -> Nikola: bike repair from offer; a second offer was rejected
  f := pg_temp.favor(ivana, 'vehicle_repair', 'Bike brakes squeak and barely stop', 'City bike, rim brakes. Probably needs new pads and adjustment.',
                     'Тафталиџе 2', 'SCHEDULED', now() + interval '1 day', 700, 'BOOKED', 'OPEN_BOARD', now() - interval '2 days');
  o := pg_temp.offer(f, nikola, 'I have pads in stock, will fix it at your place in 30 min.', 600, 'ACCEPTED', now() - interval '1 day 20 hours');
  o2 := pg_temp.offer(f, stefan, 'Not a pro, but I''ve fixed my own bike many times.', 450, 'REJECTED', now() - interval '1 day 22 hours');
  b := pg_temp.booking(f, nikola, 'GIVER_OFFER', o, 'CONFIRMED', 600, NULL, now() - interval '1 day 12 hours', now() - interval '1 day 12 hours', NULL);
  PERFORM pg_temp.pay(b, 'HELD', 'VISA', '4000', now() - interval '1 day 11 hours', NULL);
  PERFORM pg_temp.notify(nikola, 'OFFER_ACCEPTED', b, o, f, ivana, now() - interval '1 day 12 hours', TRUE);
  PERFORM pg_temp.notify(nikola, 'PAYMENT_RECEIVED', b, o, f, ivana, now() - interval '1 day 11 hours', FALSE, 600);
  PERFORM pg_temp.notify(stefan, 'OFFER_REJECTED', NULL, o2, f, ivana, now() - interval '1 day 12 hours', FALSE);

  -- Goran -> Teodora: babysitting, direct request accepted
  f := pg_temp.favor(goran, 'babysitting', 'Babysit two kids on Friday evening', 'Boys aged 5 and 8. Dinner is ready, bedtime at 21h. Back by 23h.',
                     'Кисела Вода', 'SCHEDULED', now() + interval '2 days', 1200, 'BOOKED', 'OPEN_BOARD', now() - interval '3 days');
  b := pg_temp.booking(f, teodora, 'DIRECT_REQUEST', NULL, 'CONFIRMED', 1200, 'They love board games!',
                       now() - interval '3 days', now() - interval '2 days 20 hours', NULL);
  PERFORM pg_temp.pay(b, 'HELD', 'MASTERCARD', '5555', now() - interval '2 days 19 hours', NULL);
  PERFORM pg_temp.notify(goran, 'BOOKING_ACCEPTED', b, NULL, f, teodora, now() - interval '2 days 20 hours', TRUE);
  PERFORM pg_temp.notify(teodora, 'PAYMENT_RECEIVED', b, NULL, f, goran, now() - interval '2 days 19 hours', TRUE, 1200);

  -- Petar -> Marija: cooking today, accepted but not paid yet
  f := pg_temp.favor(petar, 'home_cooking', 'Cook lunch for a family gathering', 'Around 10 people. Traditional Macedonian — tavche gravche and a salad.',
                     'Аеродром', 'SCHEDULED', now() + interval '5 hours', 2200, 'BOOKED', 'OPEN_BOARD', now() - interval '4 days');
  b := pg_temp.booking(f, marija, 'DIRECT_REQUEST', NULL, 'CONFIRMED', 2000, 'Groceries are on me, just bring your recipes.',
                       now() - interval '3 days', now() - interval '3 days', NULL);
  PERFORM pg_temp.notify(petar, 'BOOKING_ACCEPTED', b, NULL, f, marija, now() - interval '3 days', FALSE);

  -- ===== REQUESTED (waiting for the giver to answer) =====
  f := pg_temp.favor(ana, 'laundry', 'Drop off and pick up dry cleaning', 'Two coats and a suit to the dry cleaner on Makedonija street.',
                     'Центар', 'ASAP', NULL, 400, 'BOOKED', 'OPEN_BOARD', now() - interval '4 hours');
  b := pg_temp.booking(f, marija, 'DIRECT_REQUEST', NULL, 'REQUESTED', 350, 'Bags will be by the door.',
                       now() - interval '3 hours', NULL, NULL);
  PERFORM pg_temp.notify(marija, 'BOOKING_REQUESTED', b, NULL, f, ana, now() - interval '3 hours', FALSE);

  -- ===== CANCELLED (requester cancelled early, full refund) =====
  f := pg_temp.favor(petar, 'shopping', 'Buy groceries for the weekend', 'List will be shared after booking.',
                     'Аеродром', 'SCHEDULED', now() - interval '6 days', 600, 'CANCELLED', 'OPEN_BOARD', now() - interval '9 days');
  b := pg_temp.booking(f, aleks, 'DIRECT_REQUEST', NULL, 'CANCELLED', 500, NULL, now() - interval '9 days', now() - interval '9 days', NULL);
  UPDATE bookings SET cancel_reason = 'Plans changed, we''re going out of town.' WHERE id = b;
  PERFORM pg_temp.pay(b, 'REFUNDED', 'MASTERCARD', '5100', now() - interval '9 days', now() - interval '8 days');
  PERFORM pg_temp.notify(aleks, 'BOOKING_CANCELLED', b, NULL, f, petar, now() - interval '8 days', TRUE);
  PERFORM pg_temp.notify(petar, 'REFUND_ISSUED', b, NULL, f, aleks, now() - interval '8 days', TRUE, 550);

  -- ===== OPEN favors on the board (some with pending offers) =====
  f := pg_temp.favor(elena, 'shopping', 'Weekly grocery run from Ramstore', 'About 15 items, list ready. Heavy stuff: water and potatoes.',
                     'Карпош 2', 'SCHEDULED', now() + interval '2 days', 500, 'OPEN', 'OPEN_BOARD', now() - interval '20 hours');
  o := pg_temp.offer(f, stefan, 'I shop there anyway on Thursdays.', 450, 'PENDING', now() - interval '18 hours');
  PERFORM pg_temp.notify(elena, 'OFFER_RECEIVED', NULL, o, f, stefan, now() - interval '18 hours', FALSE);
  o := pg_temp.offer(f, aleks, 'I have a car, no problem with heavy bags.', 500, 'PENDING', now() - interval '6 hours');
  PERFORM pg_temp.notify(elena, 'OFFER_RECEIVED', NULL, o, f, aleks, now() - interval '6 hours', FALSE);

  f := pg_temp.favor(petar, 'housework', 'Help assembling an IKEA wardrobe', 'PAX wardrobe, 2 m wide. I have the tools, need a second pair of hands.',
                     'Аеродром', 'ASAP', NULL, 1000, 'OPEN', 'OPEN_BOARD', now() - interval '1 day');
  o := pg_temp.offer(f, marija, 'Assembled three of these already, it''ll take 2 hours.', 1000, 'PENDING', now() - interval '10 hours');
  PERFORM pg_temp.notify(petar, 'OFFER_RECEIVED', NULL, o, f, marija, now() - interval '10 hours', FALSE);

  f := pg_temp.favor(ivana, 'tutoring', 'Math tutoring for an 8th grader', 'Fractions and equations before the end-of-term test. 2 sessions a week.',
                     'Тафталиџе 2', 'SCHEDULED', now() + interval '3 days', 650, 'OPEN', 'OPEN_BOARD', now() - interval '1 day 2 hours');
  o := pg_temp.offer(f, elena, 'I teach 8th grade math, I know exactly what''s on the test.', 700, 'PENDING', now() - interval '1 day');
  PERFORM pg_temp.notify(ivana, 'OFFER_RECEIVED', NULL, o, f, elena, now() - interval '1 day', TRUE);
  o := pg_temp.offer(f, teodora, 'Happy to help, can also do homework check-ins.', 600, 'PENDING', now() - interval '5 hours');
  PERFORM pg_temp.notify(ivana, 'OFFER_RECEIVED', NULL, o, f, teodora, now() - interval '5 hours', FALSE);

  f := pg_temp.favor(ana, 'it_fixes', 'Laptop is very slow', 'Windows laptop, 4 years old. Takes 5 minutes to boot. Clean-up or SSD upgrade?',
                     'Центар', 'ASAP', NULL, 700, 'OPEN', 'OPEN_BOARD', now() - interval '8 hours');
  o := pg_temp.offer(f, nikola, 'Sounds like a dying HDD. I can swap in an SSD and move your files (SSD price extra).', 800, 'PENDING', now() - interval '2 hours');
  PERFORM pg_temp.notify(ana, 'OFFER_RECEIVED', NULL, o, f, nikola, now() - interval '2 hours', FALSE);

  f := pg_temp.favor(aleks, 'pet_care', 'Feed my cat over the weekend', 'Saturday and Sunday, once a day. Food and litter instructions on the fridge.',
                     'Гази Баба', 'SCHEDULED', now() + interval '3 days', 600, 'OPEN', 'OPEN_BOARD', now() - interval '12 hours');
  o := pg_temp.offer(f, stefan, 'Cats love me. 300 per visit.', 600, 'PENDING', now() - interval '9 hours');
  PERFORM pg_temp.notify(aleks, 'OFFER_RECEIVED', NULL, o, f, stefan, now() - interval '9 hours', FALSE);

  PERFORM pg_temp.favor(goran, 'yard_work', 'Mow the lawn and trim edges', 'About 150 m² behind the house. Mower available.',
                        'Кисела Вода', 'SCHEDULED', now() + interval '4 days', 900, 'OPEN', 'OPEN_BOARD', now() - interval '3 hours');
  PERFORM pg_temp.favor(teodora, 'it_fixes', 'Set up a printer on my laptop', 'HP printer, wireless. Can''t get it to show up on the network.',
                        'Дебар Маало', 'ASAP', NULL, 400, 'OPEN', 'OPEN_BOARD', now() - interval '1 hour');
  PERFORM pg_temp.favor(elena, 'cleaning', 'Window cleaning, 6 windows', '4th floor apartment, windows open inwards.',
                        'Карпош 2', 'SCHEDULED', now() + interval '6 days', 800, 'OPEN', 'OPEN_BOARD', now() - interval '30 minutes');

  -- ---------- derived counters (what ReviewService / completion would have accumulated) ----------
  UPDATE giver_profiles p SET
    rating_count    = COALESCE(s.cnt, 0),
    rating_avg      = COALESCE(s.avg, 0),
    completed_count = (SELECT COUNT(*) FROM bookings bb WHERE bb.giver_id = p.user_id AND bb.status IN ('COMPLETED','CLOSED'))
  FROM (SELECT up.user_id, cnt, avg FROM giver_profiles up
          LEFT JOIN (SELECT r.target_id, COUNT(*) AS cnt, ROUND(AVG(r.stars), 2) AS avg
                       FROM reviews r JOIN bookings bb ON bb.id = r.booking_id
                      WHERE r.published_at IS NOT NULL AND r.target_id = bb.giver_id
                      GROUP BY r.target_id) x ON x.target_id = up.user_id) s
  WHERE s.user_id = p.user_id AND p.user_id IN (stefan, marija, nikola, teodora, aleks, elena);

  UPDATE users u SET
    requester_rating_count = COALESCE(s.cnt, 0),
    requester_rating_avg   = COALESCE(s.avg, 0)
  FROM (SELECT uu.id, cnt, avg FROM users uu
          LEFT JOIN (SELECT r.target_id, COUNT(*) AS cnt, ROUND(AVG(r.stars), 2) AS avg
                       FROM reviews r JOIN bookings bb ON bb.id = r.booking_id
                      WHERE r.published_at IS NOT NULL AND r.target_id = bb.requester_id
                      GROUP BY r.target_id) x ON x.target_id = uu.id
         WHERE uu.email LIKE '%@demo.mk') s
  WHERE s.id = u.id;
END $$;

COMMIT;
