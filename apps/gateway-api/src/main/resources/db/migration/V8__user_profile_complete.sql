-- Existing rows already have a working (phone-digit) VPA and are treated as
-- having completed profile setup; only new signups go through the "choose
-- your FloPay ID" step.
ALTER TABLE users ADD COLUMN profile_complete BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN profile_complete DROP DEFAULT;
