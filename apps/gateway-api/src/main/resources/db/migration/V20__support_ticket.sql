CREATE TABLE support_ticket (
    id              UUID         PRIMARY KEY,
    requester_type  VARCHAR(20)  NOT NULL CHECK (requester_type IN ('MERCHANT', 'USER')),
    requester_id    BIGINT       NOT NULL,
    subject         VARCHAR(140) NOT NULL,
    message         VARCHAR(2000) NOT NULL,
    status          VARCHAR(20)  NOT NULL CHECK (status IN ('OPEN', 'RESOLVED')),
    admin_response  VARCHAR(2000),
    created_at      TIMESTAMPTZ  NOT NULL,
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_support_ticket_requester ON support_ticket (requester_type, requester_id);
CREATE INDEX idx_support_ticket_status ON support_ticket (status, created_at DESC);
