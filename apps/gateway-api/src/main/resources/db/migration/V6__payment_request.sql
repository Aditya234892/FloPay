-- A request for money: one user asking another to pay them. Approving one is
-- what actually moves money — the request itself is just an intent, and the
-- ledger stays the single source of truth for balances (settled_entry_id is
-- the audit link back to the journal entry that settled it).
--
-- Split bills reuse this table rather than getting their own: a split is just
-- N requests created together, sharing a split_group_id. Modelling it as a
-- separate concept would duplicate the whole approve/decline/settle lifecycle
-- for no benefit.

CREATE TABLE payment_request (
    id                UUID         PRIMARY KEY,

    -- Who is asking to be paid, and who is being asked. Both are users.id;
    -- no FK to a "contacts" concept because requests can go to any VPA.
    requester_user_id BIGINT       NOT NULL REFERENCES users (id),
    payer_user_id     BIGINT       NOT NULL REFERENCES users (id),

    amount_minor      BIGINT       NOT NULL CHECK (amount_minor > 0),
    note              VARCHAR(255),

    status            VARCHAR(20)  NOT NULL
                      CHECK (status IN ('PENDING', 'PAID', 'DECLINED', 'CANCELLED')),

    -- Non-null when this request is one share of a split bill.
    split_group_id    UUID,

    -- The journal entry that settled this request. Null until PAID, and the
    -- proof that a PAID request corresponds to real money having moved rather
    -- than just a status flag someone flipped.
    settled_entry_id  UUID         REFERENCES journal_entry (id),

    created_at        TIMESTAMPTZ  NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL,

    -- Asking yourself for money is meaningless and would let a user create a
    -- self-transfer through the approve path, which TransferService rejects.
    CONSTRAINT chk_payment_request_not_self CHECK (requester_user_id <> payer_user_id)
);

CREATE INDEX idx_payment_request_payer ON payment_request (payer_user_id, status);
CREATE INDEX idx_payment_request_requester ON payment_request (requester_user_id, status);
CREATE INDEX idx_payment_request_split_group ON payment_request (split_group_id);
