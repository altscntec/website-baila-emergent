-- Play-first flow: an attempt starts in an anonymous browser session; the participant (email) is captured after
-- the score is known, and the reward is issued only once that email is verified.
ALTER TABLE quiz.sessions ALTER COLUMN participant_id DROP NOT NULL;
ALTER TABLE quiz.sessions ADD COLUMN IF NOT EXISTS anon_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE quiz.sessions ADD COLUMN IF NOT EXISTS language text;

ALTER TABLE quiz.attempts ALTER COLUMN participant_id DROP NOT NULL;
ALTER TABLE quiz.attempts DROP CONSTRAINT IF EXISTS attempts_participant_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS attempts_participant_key ON quiz.attempts (participant_id) WHERE participant_id IS NOT NULL;
ALTER TABLE quiz.attempts ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES quiz.sessions(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS attempts_session_key ON quiz.attempts (session_id) WHERE session_id IS NOT NULL;
ALTER TABLE quiz.attempts ADD COLUMN IF NOT EXISTS anon_id uuid;
ALTER TABLE quiz.attempts ADD COLUMN IF NOT EXISTS claimed_at timestamptz;   -- when a verified participant received the reward for it
