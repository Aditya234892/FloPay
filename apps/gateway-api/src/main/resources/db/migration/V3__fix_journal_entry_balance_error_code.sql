-- V2's trigger function correctly rejects an unbalanced journal entry — that
-- part was verified working against real Postgres on the first try. What was
-- wrong: a bare RAISE EXCEPTION defaults to SQLSTATE P0001 (plpgsql_raise),
-- which Hibernate's SQLStateConversionDelegate does not recognise as a
-- constraint violation, so the caller saw a generic JpaSystemException
-- instead of DataIntegrityViolationException — the wrong exception type for
-- callers to branch on, even though the commit was correctly refused.
--
-- 23514 (check_violation) is the standard SQL error code for exactly this
-- kind of failure — Postgres uses it for ordinary CHECK constraints, and this
-- trigger is enforcing an invariant a single-row CHECK cannot express, so the
-- same classification applies.
CREATE OR REPLACE FUNCTION check_journal_entry_balanced() RETURNS TRIGGER AS $$
DECLARE
    affected_entry_id UUID;
    debit_total       BIGINT;
    credit_total       BIGINT;
BEGIN
    affected_entry_id := COALESCE(NEW.entry_id, OLD.entry_id);

    SELECT
        COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'DEBIT'), 0),
        COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'CREDIT'), 0)
    INTO debit_total, credit_total
    FROM posting
    WHERE entry_id = affected_entry_id;

    IF debit_total <> credit_total THEN
        RAISE EXCEPTION
            'journal_entry % is not balanced: debits=% credits=% — refusing to commit',
            affected_entry_id, debit_total, credit_total
            USING ERRCODE = '23514';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
