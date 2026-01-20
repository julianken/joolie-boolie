CREATE TABLE public.game_sessions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL UNIQUE,

  -- Game info
  game_type TEXT NOT NULL CHECK (game_type IN ('bingo', 'trivia')),
  template_id UUID,

  -- PIN Security
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_attempt_at TIMESTAMPTZ,

  -- Session state
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'expired')),
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Ownership
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Lifecycle
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX game_sessions_room_code_idx ON game_sessions(room_code);
CREATE INDEX game_sessions_status_idx ON game_sessions(status);
CREATE INDEX game_sessions_expires_at_idx ON game_sessions(expires_at);

-- RLS: Public read (for audience), write requires token validation in app
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active sessions"
  ON game_sessions FOR SELECT
  USING (status IN ('active', 'paused') AND expires_at > now());

CREATE POLICY "Anyone can create sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "App validates token for updates"
  ON game_sessions FOR UPDATE
  USING (true);

-- Room code generator function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  birds TEXT[] := ARRAY['SWAN', 'HAWK', 'DUCK', 'DOVE', 'WREN',
                        'CROW', 'HERN', 'RAVEN', 'EGRET', 'FINCH',
                        'CRANE', 'ROBIN'];
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := birds[floor(random() * array_length(birds, 1) + 1)]
            || '-'
            || floor(random() * 90 + 10)::TEXT;
    SELECT EXISTS(SELECT 1 FROM game_sessions WHERE room_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;
