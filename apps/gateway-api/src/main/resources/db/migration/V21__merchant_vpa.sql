ALTER TABLE merchants ADD COLUMN merchant_vpa VARCHAR(64);

-- Deterministic backfill for merchants that existed before this column did —
-- application code generates a nicer, name-derived handle for every merchant
-- created from here on.
UPDATE merchants SET merchant_vpa = 'merchant' || id || '@flopaybiz' WHERE merchant_vpa IS NULL;

ALTER TABLE merchants ALTER COLUMN merchant_vpa SET NOT NULL;
ALTER TABLE merchants ADD CONSTRAINT uq_merchants_merchant_vpa UNIQUE (merchant_vpa);
