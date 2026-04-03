CREATE TABLE IF NOT EXISTS rounds (
    id          SERIAL PRIMARY KEY,
    session_id  INT NOT NULL REFERENCES sessions(id),
    question_id INT NOT NULL REFERENCES questions(id),
    picked_by   INT NOT NULL REFERENCES users(id),
    status      VARCHAR(20) DEFAULT 'answering' CHECK (status IN ('answering', 'revealed')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rounds_session ON rounds(session_id);
