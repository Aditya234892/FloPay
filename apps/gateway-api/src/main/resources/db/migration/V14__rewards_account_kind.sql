-- Postgres has no ALTER CHECK — drop and recreate with REWARDS added.
ALTER TABLE account DROP CONSTRAINT account_kind_check;
ALTER TABLE account ADD CONSTRAINT account_kind_check
    CHECK (kind IN ('WALLET', 'SETTLEMENT_PENDING', 'SETTLED', 'ISSUANCE', 'FEES', 'REWARDS'));
