CREATE TABLE user_badge (
    id          UUID        PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    badge_type  VARCHAR(30) NOT NULL,
    earned_at   TIMESTAMPTZ NOT NULL,
    UNIQUE (user_id, badge_type)
);

CREATE INDEX idx_user_badge_user ON user_badge (user_id);
