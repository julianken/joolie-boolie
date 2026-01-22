-- Migration: Create OAuth Audit Log
-- Tracks all OAuth authorization events for security and compliance

-- Create oauth_audit_log table
create table public.oauth_audit_log (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  client_id text not null,
  action text not null check (action in ('authorize_success', 'authorize_deny', 'authorize_error', 'token_exchange', 'token_refresh', 'token_revoke')),
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add table and column comments
comment on table public.oauth_audit_log is 'Audit log for OAuth authorization events including approvals, denials, and errors';
comment on column public.oauth_audit_log.action is 'Type of action: authorize_success, authorize_deny, authorize_error, token_exchange, token_refresh, token_revoke';
comment on column public.oauth_audit_log.metadata is 'Additional context such as scopes, error details, or authorization_id';

-- Create indexes for common queries
create index oauth_audit_log_user_id_idx on public.oauth_audit_log(user_id);
create index oauth_audit_log_client_id_idx on public.oauth_audit_log(client_id);
create index oauth_audit_log_timestamp_idx on public.oauth_audit_log(timestamp desc);
create index oauth_audit_log_action_idx on public.oauth_audit_log(action);
create index oauth_audit_log_created_at_idx on public.oauth_audit_log(created_at desc);

-- Enable Row Level Security
alter table public.oauth_audit_log enable row level security;

-- RLS Policy: Only service role can write audit logs (enforced at application level)
-- No user should be able to write directly to audit logs
create policy "Service role can insert audit logs"
  on public.oauth_audit_log
  for insert
  to service_role
  with check (true);

-- RLS Policy: Admins can read all audit logs
-- Note: This assumes an 'is_admin' column in profiles or auth.users metadata
-- Adjust based on your admin detection logic
create policy "Admins can view all audit logs"
  on public.oauth_audit_log
  for select
  to authenticated
  using (
    -- Allow if user has admin role in auth metadata
    exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create function to automatically delete old audit logs (90-day retention)
create or replace function public.delete_old_audit_logs()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.oauth_audit_log
  where created_at < now() - interval '90 days';
end;
$$;

comment on function public.delete_old_audit_logs is 'Deletes audit logs older than 90 days for compliance with retention policy';

-- Note: Schedule this function to run daily using pg_cron or external scheduler
-- Example pg_cron schedule (if pg_cron is enabled):
-- SELECT cron.schedule('delete-old-audit-logs', '0 2 * * *', 'SELECT public.delete_old_audit_logs()');
