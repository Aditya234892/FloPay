-- An optional user-supplied message on a money movement ("for rent", "🍕
-- split"). Generic on journal_entry rather than a P2P-specific table, since
-- any entry kind could reasonably carry one later (a refund reason, a
-- request note) — not just transfers.
ALTER TABLE journal_entry ADD COLUMN note VARCHAR(255);
