CREATE TABLE notification (
    id         UUID         PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id),
    type       VARCHAR(30)  NOT NULL,
    title      VARCHAR(140) NOT NULL,
    body       VARCHAR(255) NOT NULL,
    read       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_notification_user ON notification (user_id, created_at DESC);
CREATE INDEX idx_notification_unread ON notification (user_id, read);
