-- Baila Dembow Halloween quiz: initial schema.
-- Lives in its own schema so that, on Supabase, it is NOT exposed through the
-- auto-generated REST API. RLS is also enabled on every table with no policies,
-- so even if the schema were exposed, anon/authenticated roles see nothing.
-- The API connects with the privileged DATABASE_URL role (server-side only).

CREATE SCHEMA IF NOT EXISTS quiz;

CREATE TABLE IF NOT EXISTS quiz.settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz.participants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_norm        text NOT NULL,
  email             text NOT NULL,
  full_name         text NOT NULL,
  age               integer NOT NULL CHECK (age BETWEEN 18 AND 120),
  gender            text NOT NULL CHECK (gender IN ('woman','man','non_binary','self_describe','prefer_not_to_say')),
  gender_self       text,
  city              text NOT NULL,
  country           char(2) NOT NULL,
  language          text NOT NULL CHECK (language IN ('en','es','nl')),
  anon_id           uuid NOT NULL DEFAULT gen_random_uuid(),   -- analytics id, NOT derived from PII
  attribution       jsonb NOT NULL DEFAULT '{}'::jsonb,         -- allowlisted campaign params only
  terms_version     text NOT NULL,
  terms_accepted_at timestamptz NOT NULL DEFAULT now(),
  verified_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT participants_email_norm_key UNIQUE (email_norm)
);
CREATE UNIQUE INDEX IF NOT EXISTS participants_anon_id_key ON quiz.participants (anon_id);

-- Append-only consent history. The latest row per participant is the current state.
CREATE TABLE IF NOT EXISTS quiz.marketing_consents (
  id              bigserial PRIMARY KEY,
  participant_id  uuid NOT NULL REFERENCES quiz.participants(id) ON DELETE CASCADE,
  opted_in        boolean NOT NULL,
  wording_version text NOT NULL,
  wording_text    text NOT NULL,
  language        text NOT NULL,
  source          text NOT NULL,          -- 'signup' | 'unsubscribe' | 'admin'
  recorded_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketing_consents_participant_idx ON quiz.marketing_consents (participant_id, id DESC);

-- Suppression list survives participant deletion on purpose (hash only, no identity).
CREATE TABLE IF NOT EXISTS quiz.suppressions (
  email_hash text PRIMARY KEY,
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz.verification_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  uuid NOT NULL REFERENCES quiz.participants(id) ON DELETE CASCADE,
  token_hash      text NOT NULL UNIQUE,
  code_hash       text NOT NULL,
  expires_at      timestamptz NOT NULL,
  consumed_at     timestamptz,
  failed_attempts integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_tokens_participant_idx ON quiz.verification_tokens (participant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS quiz.sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash     text NOT NULL UNIQUE,
  participant_id uuid NOT NULL REFERENCES quiz.participants(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz
);

CREATE TABLE IF NOT EXISTS quiz.questions (
  id                text PRIMARY KEY,
  theme             text NOT NULL CHECK (theme IN ('movies','facts','spells','music')),
  version           integer NOT NULL DEFAULT 1,
  active            boolean NOT NULL DEFAULT true,
  shuffle_options   boolean NOT NULL DEFAULT true,
  correct_option_id text NOT NULL,
  content           jsonb NOT NULL,      -- {prompt:{en,es,nl}, options:[{id,text:{..}}], explanation:{..}}
  source_notes      text,
  content_hash      text NOT NULL,
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questions_theme_idx ON quiz.questions (theme) WHERE active;

-- One attempt per participant == one attempt per verified email (email_norm is unique).
CREATE TABLE IF NOT EXISTS quiz.attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL UNIQUE REFERENCES quiz.participants(id) ON DELETE CASCADE,
  theme          text NOT NULL CHECK (theme IN ('movies','facts','spells','music')),
  status         text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  score          integer CHECK (score BETWEEN 0 AND 5),
  tier           integer CHECK (tier IN (5,10,15))
);
CREATE INDEX IF NOT EXISTS attempts_theme_idx ON quiz.attempts (theme);

CREATE TABLE IF NOT EXISTS quiz.attempt_questions (
  attempt_id          uuid NOT NULL REFERENCES quiz.attempts(id) ON DELETE CASCADE,
  position            integer NOT NULL CHECK (position BETWEEN 0 AND 4),
  question_id         text NOT NULL,
  question_version    integer NOT NULL,
  content_snapshot    jsonb NOT NULL,      -- frozen wording so later edits never change a live attempt
  option_order        jsonb NOT NULL,      -- shuffled array of option ids
  correct_option_id   text NOT NULL,       -- snapshot of the key at attempt start; never sent to browsers
  selected_option_id  text,
  shown_at            timestamptz,
  answered_at         timestamptz,
  duration_ms         integer,
  PRIMARY KEY (attempt_id, position),
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS quiz.discount_codes (
  id             bigserial PRIMARY KEY,
  tier           integer NOT NULL CHECK (tier IN (5,10,15)),
  code           text NOT NULL UNIQUE,
  batch          text NOT NULL DEFAULT 'default',
  status         text NOT NULL DEFAULT 'available' CHECK (status IN ('available','issued','void')),
  participant_id uuid UNIQUE REFERENCES quiz.participants(id) ON DELETE SET NULL,
  imported_at    timestamptz NOT NULL DEFAULT now(),
  issued_at      timestamptz
);
CREATE INDEX IF NOT EXISTS discount_codes_available_idx ON quiz.discount_codes (tier, id) WHERE status = 'available';

CREATE TABLE IF NOT EXISTS quiz.rewards (
  participant_id uuid PRIMARY KEY REFERENCES quiz.participants(id) ON DELETE CASCADE,
  attempt_id     uuid NOT NULL UNIQUE REFERENCES quiz.attempts(id) ON DELETE CASCADE,
  tier           integer NOT NULL CHECK (tier IN (5,10,15)),
  code_id        bigint UNIQUE REFERENCES quiz.discount_codes(id),
  status         text NOT NULL CHECK (status IN ('issued','pending_inventory')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  issued_at      timestamptz
);

-- Orders that used a code, imported from the ticketing platform's order export.
CREATE TABLE IF NOT EXISTS quiz.redemptions (
  id          bigserial PRIMARY KEY,
  code_id     bigint NOT NULL REFERENCES quiz.discount_codes(id),
  order_ref   text NOT NULL,
  ordered_at  timestamptz,
  gross_cents integer,
  net_cents   integer,
  currency    text NOT NULL DEFAULT 'EUR',
  status      text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','refunded','cancelled')),
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_ref)
);
CREATE INDEX IF NOT EXISTS redemptions_code_idx ON quiz.redemptions (code_id);

CREATE TABLE IF NOT EXISTS quiz.email_outbox (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id      uuid NOT NULL REFERENCES quiz.participants(id) ON DELETE CASCADE,
  kind                text NOT NULL CHECK (kind IN ('signin','reward')),
  language            text NOT NULL,
  idempotency_key     text NOT NULL UNIQUE,
  status              text NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','sending','accepted','delivered','delayed','bounced','complained','failed')),
  provider_message_id text,
  attempts            integer NOT NULL DEFAULT 0,
  last_error          text,
  next_attempt_at     timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  accepted_at         timestamptz,
  delivered_at        timestamptz
);
CREATE INDEX IF NOT EXISTS email_outbox_status_idx ON quiz.email_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS email_outbox_participant_idx ON quiz.email_outbox (participant_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS email_outbox_provider_idx ON quiz.email_outbox (provider_message_id);

CREATE TABLE IF NOT EXISTS quiz.email_events (
  id                  text PRIMARY KEY,           -- webhook delivery id (idempotent)
  outbox_id           uuid REFERENCES quiz.email_outbox(id) ON DELETE CASCADE,
  provider_message_id text,
  type                text NOT NULL,
  occurred_at         timestamptz,
  received_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz.rate_limits (
  key          text NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

-- Server-side journey events. Anonymous id only; never email, name, code or token.
CREATE TABLE IF NOT EXISTS quiz.funnel_events (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  anon_id     uuid,
  name        text NOT NULL,
  theme       text,
  language    text,
  question_id text,
  tier        integer,
  props       jsonb NOT NULL DEFAULT '{}'::jsonb,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS funnel_events_name_at_idx ON quiz.funnel_events (name, at);
CREATE INDEX IF NOT EXISTS funnel_events_anon_idx ON quiz.funnel_events (anon_id);

-- Cookieless, identifier-free daily counters (landing views, CTA clicks).
CREATE TABLE IF NOT EXISTS quiz.daily_counters (
  day      date NOT NULL,
  metric   text NOT NULL,
  dim_key  text NOT NULL,              -- canonical "source|medium|campaign|content|language"
  dims     jsonb NOT NULL,
  count    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric, dim_key)
);

CREATE TABLE IF NOT EXISTS quiz.owner_alerts (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  kind        text NOT NULL,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS owner_alerts_open_idx ON quiz.owner_alerts (kind, at DESC) WHERE resolved_at IS NULL;

CREATE TABLE IF NOT EXISTS quiz.audit_log (
  id     bigserial PRIMARY KEY,
  at     timestamptz NOT NULL DEFAULT now(),
  actor  text NOT NULL,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Defence in depth: no policies => only the table owner / service role can read or write.
ALTER TABLE quiz.settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.participants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.marketing_consents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.suppressions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.attempts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.attempt_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.discount_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.rewards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.redemptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.email_outbox        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.email_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.rate_limits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.funnel_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.daily_counters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.owner_alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz.audit_log           ENABLE ROW LEVEL SECURITY;
