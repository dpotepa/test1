CREATE TABLE IF NOT EXISTS sessions (
    id            SERIAL PRIMARY KEY,
    invite_code   VARCHAR(12) UNIQUE NOT NULL,
    user1_id      INT NOT NULL REFERENCES users(id),
    user2_id      INT REFERENCES users(id),
    status        VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'archived')),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_invite_code ON sessions(invite_code);
CREATE INDEX IF NOT EXISTS idx_sessions_user1 ON sessions(user1_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user2 ON sessions(user2_id);
