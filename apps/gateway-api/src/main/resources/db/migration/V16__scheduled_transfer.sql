CREATE TABLE scheduled_transfer (
    id            UUID         PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    to_vpa        VARCHAR(255) NOT NULL,
    amount_minor  BIGINT       NOT NULL CHECK (amount_minor > 0),
    note          VARCHAR(140),
    frequency     VARCHAR(20)  CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    next_run_at   TIMESTAMPTZ  NOT NULL,
    last_run_at   TIMESTAMPTZ,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    last_error    VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_scheduled_transfer_due ON scheduled_transfer (active, next_run_at);
CREATE INDEX idx_scheduled_transfer_user ON scheduled_transfer (user_id, active);
