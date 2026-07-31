-- Opt-in app-lock PIN. Null = not configured; the wallet app only shows a
-- PIN unlock screen once a user has actually set one.
ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255);
