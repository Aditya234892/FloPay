CREATE TABLE referral (
    id                UUID        PRIMARY KEY,
    referrer_user_id  BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    referee_user_id   BIGINT      NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    status            VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'REWARDED')),
    created_at        TIMESTAMPTZ NOT NULL,
    rewarded_at       TIMESTAMPTZ,
    CHECK (referrer_user_id <> referee_user_id)
);

CREATE INDEX idx_referral_referrer ON referral (referrer_user_id);
