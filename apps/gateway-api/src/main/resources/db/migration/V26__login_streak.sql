CREATE TABLE login_streak (
    user_id          BIGINT      PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    current_streak   INT         NOT NULL DEFAULT 0,
    longest_streak   INT         NOT NULL DEFAULT 0,
    last_check_in    DATE,
    created_at       TIMESTAMPTZ NOT NULL
);
