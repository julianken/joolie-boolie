# OAuth Audit Logging System

This document describes the OAuth audit logging system implemented for the Platform Hub.

## Overview

The audit logging system tracks all OAuth authorization events for security, compliance, and debugging purposes. All events are logged to the `oauth_audit_log` table in Supabase.

## Components

### 1. Database Schema (`supabase/migrations/20260121172136_create_oauth_audit_log.sql`)

Creates the `oauth_audit_log` table with the following structure:

```sql
CREATE TABLE oauth_audit_log (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),
  client_id TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB
);
```

**Action Types:**
- `authorize_success` - User approved authorization
- `authorize_deny` - User denied authorization
- `authorize_error` - Error during authorization flow
- `token_exchange` - Authorization code exchanged for token
- `token_refresh` - Refresh token used
- `token_revoke` - Token revoked

**Features:**
- Indexes on frequently queried columns (user_id, client_id, timestamp, action)
- Row Level Security (RLS) policies
- 90-day retention policy (automatic cleanup function)
- Service role write access only (prevents tampering)

### 2. Audit Log Functions (`src/lib/audit-log.ts`)

Core logging functions that write to the database using the service role client.

**Main Functions:**

```typescript
// Generic audit log entry
await logAuditEvent({
  user_id: 'uuid',
  client_id: 'my-app',
  action: 'authorize_success',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  metadata: { scopes: ['openid', 'email'] }
});

// Helper functions for specific events
await logAuthorizationSuccess(userId, clientId, authId, scopes, ip, userAgent);
await logAuthorizationDenial(userId, clientId, authId, reason, ip, userAgent);
await logAuthorizationError(userId, clientId, authId, error, ip, userAgent);
await logTokenExchange(userId, clientId, authId, ip, userAgent);
await logTokenRefresh(userId, clientId, ip, userAgent);
await logTokenRevoke(userId, clientId, reason, ip, userAgent);
```

**Security:**
- Uses service role key (must be server-side only)
- Bypasses RLS to ensure logs cannot be tampered with
- Validates environment variables on startup

### 3. Middleware Utilities (`src/middleware/audit-middleware.ts`)

Helper functions to extract request metadata and integrate audit logging.

**Key Functions:**

```typescript
// Extract IP address (handles proxies, load balancers)
const ip = extractIpAddress(request);

// Extract user agent
const userAgent = extractUserAgent(request);

// Extract all metadata
const { ipAddress, userAgent } = extractRequestMetadata(request);

// High-level audit wrappers (includes metadata extraction)
await auditAuthorizationSuccess(request, userId, clientId, authId, scopes);
await auditAuthorizationDenial(request, userId, clientId, authId, reason);
await auditAuthorizationError(request, userId, clientId, authId, error);
```

### 4. API Routes (Example Implementation)

Two API routes demonstrate integration:

- `POST /api/oauth/approve` - Handles authorization approval + audit logging
- `POST /api/oauth/deny` - Handles authorization denial + audit logging

**Request Body:**
```json
{
  "authorization_id": "auth-uuid",
  "reason": "optional-denial-reason"
}
```

**Response:**
```json
{
  "redirect_to": "https://client-app.com/callback?code=..."
}
```

## Integration Guide

### Step 1: Run Database Migration

```bash
# Apply the migration to create the audit log table
supabase migration apply 20260121172136_create_oauth_audit_log.sql

# Or use Supabase CLI
supabase db push
```

### Step 2: Configure Environment Variables

Ensure your `.env.local` has the service role key:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for audit logging
```

**Security Note:** The service role key should NEVER be exposed to the client. Only use it in:
- API routes (`app/api/**/route.ts`)
- Server Components
- Server Actions
- Middleware (with caution)

### Step 3: Integrate into OAuth Flow

#### Option A: Use API Routes (Recommended)

Update your client-side consent page to call the API routes:

```typescript
// In src/app/oauth/consent/page.tsx
const handleApprove = async () => {
  const response = await fetch('/api/oauth/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorization_id: authorizationId })
  });

  const data = await response.json();
  if (data.redirect_to) {
    window.location.href = data.redirect_to;
  }
};

const handleDeny = async () => {
  const response = await fetch('/api/oauth/deny', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorization_id: authorizationId,
      reason: 'user_denied'
    })
  });

  const data = await response.json();
  if (data.redirect_to) {
    window.location.href = data.redirect_to;
  }
};
```

#### Option B: Direct Integration (Server Components)

If using Server Components or Server Actions:

```typescript
import { headers } from 'next/headers';
import { auditAuthorizationSuccess } from '@/middleware/audit-middleware';

async function approveAuthorization(authorizationId: string) {
  'use server';

  const supabase = await createClient();
  const headersList = await headers();

  // Create a mock request object for metadata extraction
  const request = {
    headers: {
      get: (name: string) => headersList.get(name)
    }
  } as Request;

  // Approve authorization
  const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId);

  if (!error && data) {
    // Get details for audit log
    const { data: details } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

    // Log to audit
    await auditAuthorizationSuccess(
      request,
      session.user.id,
      details.client.id,
      authorizationId,
      details.scopes
    );
  }

  return data;
}
```

### Step 4: Query Audit Logs

#### View All Logs for a User

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, serviceRoleKey);

const { data, error } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('user_id', userId)
  .order('timestamp', { ascending: false })
  .limit(100);
```

#### View Failed Authorization Attempts

```typescript
const { data, error } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('action', 'authorize_error')
  .order('timestamp', { ascending: false });
```

#### View All Events for a Client

```typescript
const { data, error } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('client_id', 'my-client-id')
  .order('timestamp', { ascending: false });
```

## Retention Policy

Audit logs are automatically deleted after 90 days by calling the `delete_old_audit_logs()` function.

### Manual Cleanup

```sql
SELECT public.delete_old_audit_logs();
```

### Automated Cleanup (using pg_cron)

If pg_cron is enabled in your Supabase project:

```sql
SELECT cron.schedule(
  'delete-old-audit-logs',
  '0 2 * * *',  -- Run daily at 2 AM
  'SELECT public.delete_old_audit_logs()'
);
```

Or use an external scheduler (GitHub Actions, Vercel Cron, etc.) to call an API route:

```typescript
// app/api/cron/cleanup-audit-logs/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(url, serviceRoleKey);
  const { error } = await supabase.rpc('delete_old_audit_logs');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
```

## Security Considerations

1. **Service Role Key Protection**
   - Never expose service role key to client-side code
   - Only use in server-side contexts (API routes, Server Components)
   - Rotate keys periodically

2. **RLS Policies**
   - Only service role can write to audit logs
   - Only admins can read audit logs
   - Users cannot modify or delete their own logs

3. **Data Sensitivity**
   - IP addresses and user agents are considered PII
   - Ensure compliance with GDPR, CCPA, and other privacy laws
   - Consider anonymizing/hashing IP addresses if required

4. **Monitoring**
   - Set up alerts for unusual authorization patterns
   - Monitor for repeated failures (potential attacks)
   - Track authorization success rates

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { logAuditEvent } from '@/lib/audit-log';

describe('Audit Logging', () => {
  it('should log authorization success', async () => {
    const mockSupabase = vi.fn();

    await logAuditEvent({
      user_id: 'user-123',
      client_id: 'client-abc',
      action: 'authorize_success',
      metadata: { scopes: ['openid', 'email'] }
    });

    // Verify database call was made
    expect(mockSupabase).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('OAuth Approve API', () => {
  it('should create audit log on approval', async () => {
    const response = await fetch('/api/oauth/approve', {
      method: 'POST',
      body: JSON.stringify({ authorization_id: 'auth-123' })
    });

    expect(response.ok).toBe(true);

    // Verify audit log entry exists
    const logs = await supabase
      .from('oauth_audit_log')
      .select('*')
      .eq('action', 'authorize_success')
      .single();

    expect(logs.data).toBeDefined();
  });
});
```

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is not configured"

**Cause:** Service role key is missing from environment variables.

**Solution:** Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Error: "Failed to write audit log"

**Cause:** Database connection issue or RLS policy blocking write.

**Solution:**
1. Verify service role key is correct
2. Check RLS policies allow service role writes
3. Verify table exists (run migration)

### Audit logs not appearing

**Cause:** Logs may be written but not visible due to RLS.

**Solution:**
1. Query using service role client
2. Verify user has admin role (if using admin policy)
3. Check database logs for errors

## Future Enhancements

1. **Real-time Monitoring Dashboard**
   - Live view of authorization events
   - Anomaly detection
   - Success/failure metrics

2. **Export Functionality**
   - CSV/JSON export for compliance
   - Filtered exports by date range, user, client

3. **Alerting System**
   - Email/SMS alerts for suspicious activity
   - Webhook notifications for failed attempts

4. **Extended Metadata**
   - Device fingerprinting
   - Geolocation
   - Browser/OS detection

5. **Log Analysis**
   - ML-based anomaly detection
   - Pattern recognition
   - Risk scoring
