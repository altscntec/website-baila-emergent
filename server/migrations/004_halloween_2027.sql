-- Halloween 2027 early-release list: name, email and phone left on /halloween/2027 so the person can be told
-- first when the 2027 tickets are released. Separate from the quiz tables; one row per email address.
CREATE TABLE IF NOT EXISTS quiz.h27_signups (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          text NOT NULL,
  email              text NOT NULL,
  email_norm         text NOT NULL UNIQUE,
  phone              text NOT NULL,          -- as typed
  phone_norm         text NOT NULL,          -- +<country><number>, digits only after the plus
  consent_text       text NOT NULL,          -- exact wording shown when the box was ticked
  consent_at         timestamptz NOT NULL DEFAULT now(),
  attribution        jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirm_status     text NOT NULL DEFAULT 'none',   -- none | accepted | failed
  confirm_message_id text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE quiz.h27_signups ENABLE ROW LEVEL SECURITY;
