CREATE TABLE refresh_token (
    id             UUID         PRIMARY KEY,
    principal_type VARCHAR(20)  NOT NULL CHECK (principal_type IN ('MERCHANT', 'USER')),
    principal_id   BIGINT       NOT NULL,
    token_hash     VARCHAR(64)  NOT NULL UNIQUE,
    expires_at     TIMESTAMPTZ  NOT NULL,
    revoked_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_refresh_token_principal ON refresh_token (principal_type, principal_id);
