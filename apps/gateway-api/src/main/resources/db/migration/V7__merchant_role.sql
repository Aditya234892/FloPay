-- Every merchant defaults to MERCHANT; ADMIN is granted by listing an email
-- in flopay.admin.emails (see MerchantService) rather than through any
-- self-service flow, so this column exists but nothing sets it to ADMIN
-- automatically.
ALTER TABLE merchants ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'MERCHANT';
