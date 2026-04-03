CREATE TABLE IF NOT EXISTS answers (
    id          SERIAL PRIMARY KEY,
    round_id    INT NOT NULL REFERENCES rounds(id),
    user_id     INT NOT NULL REFERENCES users(id),
    answer_type VARCHAR(10) DEFAULT 'text' CHECK (answer_type IN ('text', 'photo', 'video')),
    text        TEXT,
    media_url   VARCHAR(500),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(round_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_round ON answers(round_id);
