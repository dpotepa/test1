-- Add 'voice' to answer_type CHECK constraint
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_answer_type_check;
ALTER TABLE answers ADD CONSTRAINT answers_answer_type_check CHECK (answer_type IN ('text', 'photo', 'video', 'voice'));
