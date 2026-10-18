-- Skopje is small: no coordinates or radius search. Every user has a neighbourhood, every favor
-- carries one, and people judge for themselves whether it's close enough.
ALTER TABLE users ADD COLUMN neighbourhood VARCHAR(120) NOT NULL DEFAULT '';

ALTER TABLE favors ADD COLUMN neighbourhood VARCHAR(120) NOT NULL DEFAULT '';
UPDATE favors SET neighbourhood = COALESCE(address_text, '');
ALTER TABLE favors DROP COLUMN address_text, DROP COLUMN latitude, DROP COLUMN longitude;

ALTER TABLE giver_profiles DROP COLUMN latitude, DROP COLUMN longitude, DROP COLUMN radius_km;
