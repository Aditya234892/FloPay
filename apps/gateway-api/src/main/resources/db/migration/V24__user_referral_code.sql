ALTER TABLE users ADD COLUMN referral_code VARCHAR(16);

-- Deterministic backfill for users that existed before this column did.
UPDATE users SET referral_code = 'FLO' || LPAD(id::text, 6, '0') WHERE referral_code IS NULL;

ALTER TABLE users ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uq_users_referral_code UNIQUE (referral_code);
