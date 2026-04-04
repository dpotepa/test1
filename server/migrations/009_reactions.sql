CREATE TABLE IF NOT EXISTS reactions (
    id          SERIAL PRIMARY KEY,
    answer_id   INT NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id),
    emoji       VARCHAR(10) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(answer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_answer ON reactions(answer_id);
