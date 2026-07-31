CREATE TABLE webauthn_credential (
    id                     UUID         PRIMARY KEY,
    user_id                BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    credential_id_base64   VARCHAR(512) NOT NULL UNIQUE,
    public_key_cose_base64 VARCHAR(1024) NOT NULL,
    signature_count        BIGINT       NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_webauthn_credential_user ON webauthn_credential (user_id);
