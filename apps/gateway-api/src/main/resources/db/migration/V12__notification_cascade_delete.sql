-- Unlike ledger tables (never cascade — money history must never silently
-- disappear), a notification is meaningless once its owning user is gone.
-- Discovered via test teardown: deleting a test user with notifications
-- violated notification_user_id_fkey because V10 didn't cascade.
ALTER TABLE notification DROP CONSTRAINT notification_user_id_fkey;
ALTER TABLE notification ADD CONSTRAINT notification_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
