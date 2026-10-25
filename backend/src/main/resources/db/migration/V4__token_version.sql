-- Bumped on logout: every token carries the version it was issued with, so bumping it revokes them all.
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
