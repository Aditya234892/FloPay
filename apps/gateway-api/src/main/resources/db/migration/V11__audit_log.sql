CREATE TABLE audit_log (
    id         UUID         PRIMARY KEY,
    actor_type VARCHAR(20)  NOT NULL,
    actor_id   BIGINT,
    action     VARCHAR(60)  NOT NULL,
    details    VARCHAR(500),
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_audit_log_created ON audit_log (created_at DESC);
