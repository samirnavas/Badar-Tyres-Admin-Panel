-- Run once in the Supabase SQL Editor.
-- Usernames are stored on public.users; passwords live in Supabase Auth only.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (lower(username));

-- Backfill usernames from email local-part for any existing rows (safe default).
UPDATE users
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL OR username = '';
