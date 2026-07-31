CREATE TABLE merchant_wallet_payment (
    id                           UUID         PRIMARY KEY,
    merchant_id                  BIGINT       NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    payer_user_id                BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    payer_vpa_snapshot           VARCHAR(255) NOT NULL,
    payer_display_name_snapshot  VARCHAR(255),
    amount_minor                 BIGINT       NOT NULL CHECK (amount_minor > 0),
    note                         VARCHAR(140),
    entry_id                     UUID         NOT NULL,
    created_at                   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_merchant_wallet_payment_merchant ON merchant_wallet_payment (merchant_id, created_at DESC);
