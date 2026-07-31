CREATE TABLE payment_link (
    id              UUID         PRIMARY KEY,
    code            VARCHAR(12)  NOT NULL UNIQUE,
    creator_user_id BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    amount_minor    BIGINT       CHECK (amount_minor IS NULL OR amount_minor > 0),
    note            VARCHAR(140),
    status          VARCHAR(20)  NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at      TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_payment_link_creator ON payment_link (creator_user_id, created_at DESC);
