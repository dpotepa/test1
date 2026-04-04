-- Add mode to sessions (duo = 2 players, party = unlimited)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'duo';

-- Participants junction table (tracks everyone in party mode)
CREATE TABLE IF NOT EXISTS session_participants (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES sessions(id),
    user_id INT NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);

-- Add mode to questions (duo, party, both)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'both';
