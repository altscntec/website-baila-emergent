-- Per-reward validity window: codes expire a fixed number of hours after they are issued
-- (setting code_valid_hours), capped by the campaign-wide code_expires_at.
ALTER TABLE quiz.rewards ADD COLUMN IF NOT EXISTS expires_at timestamptz;
