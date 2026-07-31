-- Mirrors payment_request's shape: an intent row, decided by an admin
-- merchant, settled through the same wallet-crediting path the old instant
-- top-up endpoint used (settled_entry_id records that journal entry).

CREATE TABLE top_up_request (
    id                     UUID         PRIMARY KEY,
    user_id                BIGINT       NOT NULL REFERENCES users (id),
    amount_minor           BIGINT       NOT NULL CHECK (amount_minor > 0),
    note                   VARCHAR(255),

    status                 VARCHAR(20)  NOT NULL
                           CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

    decided_by_merchant_id BIGINT       REFERENCES merchants (id),
    decided_at             TIMESTAMPTZ,
    settled_entry_id       UUID         REFERENCES journal_entry (id),

    created_at             TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_top_up_request_user ON top_up_request (user_id, status);
CREATE INDEX idx_top_up_request_status ON top_up_request (status, created_at);
