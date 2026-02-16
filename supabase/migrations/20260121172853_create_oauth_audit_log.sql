-- Create OAuth Audit Log Table
-- Tracks all OAuth authorization events for security and compliance

-- Create oauth_audit_log table
CREATE TABLE oauth_audit_log (
  -- Primary identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- User who performed the action (nullable for unauthenticated attempts)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- OAuth client identifier
  client_id TEXT NOT NULL,

  -- Action type with constraint
  action TEXT NOT NULL CHECK (action IN (
    'authorize_success',  -- User approved authorization
    'authorize_deny',     -- User denied authorization
    'authorize_error',    -- Error during authorization
    'token_exchange',     -- Authorization code exchanged for token
    'token_refresh',      -- Refresh token used
    'token_revoke'        -- Token revoked
  )),

  -- Request metadata
  ip_address INET,           -- Client IP address
  user_agent TEXT,           -- Client user agent
  metadata JSONB DEFAULT '{}'::jsonb,  -- Additional context

  -- Audit timestamp (for record creation tracking)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX oauth_audit_log_timestamp_idx ON oauth_audit_log(timestamp DESC);
CREATE INDEX oauth_audit_log_user_id_idx ON oauth_audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX oauth_audit_log_client_id_idx ON oauth_audit_log(client_id);
CREATE INDEX oauth_audit_log_action_idx ON oauth_audit_log(action);
CREATE INDEX oauth_audit_log_ip_address_idx ON oauth_audit_log(ip_address) WHERE ip_address IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE oauth_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert (application writes only)
CREATE POLICY "Service role can insert audit logs"
ON oauth_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Service role can read all logs (admin reads via API with service_role key)
CREATE POLICY "Service role can read audit logs"
ON oauth_audit_log
FOR SELECT
TO service_role
USING (true);

-- Policy: Users can read their own audit log entries
CREATE POLICY "Users can read own audit logs"
ON oauth_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Function to delete audit logs older than 90 days (retention policy)
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 90 days
  DELETE FROM oauth_audit_log
  WHERE timestamp < NOW() - INTERVAL '90 days';

  -- Get count of deleted rows
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain retention policy setup
COMMENT ON FUNCTION delete_old_audit_logs() IS
'Deletes audit log entries older than 90 days.
Schedule this function to run daily using pg_cron or external scheduler:
  - pg_cron: SELECT cron.schedule(''delete-old-audit-logs'', ''0 2 * * *'', ''SELECT public.delete_old_audit_logs()'');
  - External: Call via API endpoint /api/cron/cleanup-audit-logs';
