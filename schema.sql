-- Hanzo Base schema for Habit Streak (the `databaseSchema` DDL).
--
-- On publish, Hanzo Cloud translates each CREATE TABLE into a Hanzo Base
-- collection via `provisionBaseFromDDL` (additive + idempotent). Base manages
-- `id`/`created`/`updated`/`owner`/`org` itself, so they are never re-declared
-- here; every row is stamped with the verified IAM `owner`+`org`. Each
-- collection is org-scoped by the access rule `@request.auth.org_id = org`, so
-- a member of your org reads/writes it and other orgs cannot see it.
--
-- Keep this file in lockstep with what the app reads/writes
-- (src/lib/habits.ts types + src/lib/data.ts hooks).

-- A habit you want to keep — its name and intended rhythm.
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cadence TEXT NOT NULL DEFAULT 'daily'
);

-- One check-in: a habit marked done on a local calendar day ('YYYY-MM-DD').
-- A day is either present (done) or absent (not) — streaks and the heatmap are
-- derived from these rows in the client.
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit TEXT NOT NULL,
  day TEXT NOT NULL
);
