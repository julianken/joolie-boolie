-- Fix cleanup_expired_authorizations() to also clean approved/denied expired records
-- Previously only cleaned 'pending' records, leaving expired 'approved' and 'denied' records behind
--
-- BEA-523: CORS production guard and OAuth token hardening

CREATE OR REPLACE FUNCTION cleanup_expired_authorizations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete authorizations that have expired, regardless of status
  -- This includes pending, approved, denied, and expired records past their expires_at
  DELETE FROM oauth_authorizations
  WHERE expires_at < NOW()
    AND status IN ('pending', 'approved', 'denied', 'expired');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_authorizations() IS
'Deletes expired authorization requests regardless of status (pending, approved, denied, expired).
Schedule this to run periodically (e.g., every 6 hours) via pg_cron or external scheduler.';
