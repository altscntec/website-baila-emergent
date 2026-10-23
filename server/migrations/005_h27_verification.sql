-- Halloween 2027 list: the email is confirmed with a 6-digit code and the phone number with a WhatsApp (or SMS)
-- one-time code sent through the verification provider. Only rows with both timestamps count as verified.
ALTER TABLE quiz.h27_signups
  ADD COLUMN IF NOT EXISTS email_verified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS email_code_hash        text,
  ADD COLUMN IF NOT EXISTS email_code_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS email_code_attempts    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_code_sent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS phone_channel          text,                                   -- whatsapp | sms
  ADD COLUMN IF NOT EXISTS phone_code_sent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verify_status    text NOT NULL DEFAULT 'none';           -- none | sent | verified | failed
