# OAuth Audit Logging System

Comprehensive audit logging for OAuth authorization events in Platform Hub.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Components](#components)
- [Integration Guide](#integration-guide)
- [Usage Examples](#usage-examples)
- [Querying Audit Logs](#querying-audit-logs)
- [Retention Policy](#retention-policy)
- [Security Considerations](#security-considerations)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

## Overview

The OAuth audit logging system provides comprehensive tracking of all OAuth authorization events, including:

- **Authorization Success**: User approves authorization request
- **Authorization Denial**: User denies authorization request
- **Authorization Errors**: Errors during authorization flow
- **Token Exchange**: Authorization code exchanged for access token
- **Token Refresh**: Refresh token used to obtain new access token
- **Token Revoke**: Access or refresh token revoked

### Key Features

- **Type-Safe**: Full TypeScript support with strict typing
- **Server-Side Only**: Service role client ensures logs are tamper-proof
- **Request Metadata**: Automatically captures IP address and user agent
- **Flexible Metadata**: JSONB field for additional context
- **90-Day Retention**: Automatic cleanup via configurable function
- **RLS Policies**: Admin-only read access, service role write access
- **Performance**: Indexed columns for efficient querying

## Architecture

### Data Flow

```
1. User Action (Approve/Deny)
   ↓
2. API Route Handler (/api/oauth/approve or /api/oauth/deny)
   ↓
3. Extract Request Metadata (IP, User Agent)
   ↓
4. Supabase OAuth SDK Call (approve/deny)
   ↓
5. Log to Audit Log (Service Role Client)
   ↓
6. Return Response to Client
```

### Security Model

1. **Write Access**: Service role only (application-controlled)
2. **Read Access**: Admin users only (configurable RLS)
3. **Environment Isolation**: Service role key server-side only
4. **Tamper Prevention**: Users cannot modify their own logs

## Database Schema

### Table: `oauth_audit_log`

```sql
CREATE TABLE oauth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (...)),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

- `oauth_audit_log_timestamp_idx` - Timestamp (DESC) for recent queries
- `oauth_audit_log_user_id_idx` - User ID (partial, WHERE user_id IS NOT NULL)
- `oauth_audit_log_client_id_idx` - Client ID for client-specific queries
- `oauth_audit_log_action_idx` - Action type for filtering
- `oauth_audit_log_ip_address_idx` - IP address (partial, WHERE ip_address IS NOT NULL)

### Action Types

| Action | Description |
|--------|-------------|
| `authorize_success` | User approved authorization |
| `authorize_deny` | User denied authorization |
| `authorize_error` | Error during authorization flow |
| `token_exchange` | Authorization code exchanged for token |
| `token_refresh` | Refresh token used |
| `token_revoke` | Token revoked |

## Components

### 1. Database Migration

**File**: `supabase/migrations/20260121172853_create_oauth_audit_log.sql`

Creates the audit log table, indexes, RLS policies, and retention function.

### 2. Audit Logging Library

**File**: `apps/platform-hub/src/lib/audit-log.ts`

Core logging functions using service role client:

- `logAuditEvent(entry)` - Generic audit log writer
- `logAuthorizationSuccess(...)` - Log successful authorizations
- `logAuthorizationDenial(...)` - Log authorization denials
- `logAuthorizationError(...)` - Log errors during authorization
- `logTokenExchange(...)` - Log token exchanges
- `logTokenRefresh(...)` - Log token refreshes
- `logTokenRevoke(...)` - Log token revocations

### 3. Middleware Utilities

**File**: `apps/platform-hub/src/middleware/audit-middleware.ts`

Helper functions for request metadata extraction:

- `extractIpAddress(request)` - Extract IP from headers
- `extractUserAgent(request)` - Extract user agent
- `extractRequestMetadata(request)` - Extract all metadata
- `auditAuthorizationSuccess(request, ...)` - High-level wrapper
- `auditAuthorizationDenial(request, ...)` - High-level wrapper
- `auditAuthorizationError(request, ...)` - High-level wrapper

### 4. Example API Routes

**Files**:
- `apps/platform-hub/src/app/api/oauth/approve/route.ts`
- `apps/platform-hub/src/app/api/oauth/deny/route.ts`

Demonstrate integration of audit logging with OAuth flow.

## Integration Guide

### Approach A: API Routes (Recommended)

Create API routes that handle OAuth flow and audit logging:

```typescript
// apps/platform-hub/src/app/api/oauth/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditAuthorizationSuccess } from '@/middleware/audit-middleware';

export async function POST(request: NextRequest) {
  const { authorization_id } = await request.json();
  const supabase = await createClient();

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  // Get authorization details
  const { data: authDetails } = await supabase.auth.oauth.getAuthorizationDetails(
    authorization_id
  );

  // Approve authorization
  const { data: approvalData } = await supabase.auth.oauth.approveAuthorization(
    authorization_id
  );

  // Log to audit log
  await auditAuthorizationSuccess(
    request,
    session.user.id,
    authDetails.client.id,
    authorization_id,
    authDetails.scopes
  );

  return NextResponse.json({ redirect_url: approvalData.redirect_to });
}
```

Update client-side code to use API route:

```typescript
// apps/platform-hub/src/app/oauth/consent/page.tsx
const handleApprove = async () => {
  const response = await fetch('/api/oauth/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorization_id }),
  });

  const { redirect_url } = await response.json();
  window.location.href = redirect_url;
};
```

### Approach B: Server Actions

Add audit logging to existing Server Actions:

```typescript
// apps/platform-hub/src/app/oauth/consent/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { logAuthorizationSuccess } from '@/lib/audit-log';
import { headers } from 'next/headers';

export async function approveAuthorization(authorizationId: string) {
  const supabase = await createClient();
  const headersList = await headers();

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  // Get authorization details
  const { data: authDetails } = await supabase.auth.oauth.getAuthorizationDetails(
    authorizationId
  );

  // Approve authorization
  const { data } = await supabase.auth.oauth.approveAuthorization(authorizationId);

  // Manually extract metadata from headers
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim();
  const userAgent = headersList.get('user-agent') ?? undefined;

  // Log to audit log
  await logAuthorizationSuccess(
    session.user.id,
    authDetails.client.id,
    authorizationId,
    authDetails.scopes,
    ipAddress,
    userAgent
  );

  return data.redirect_to;
}
```

## Usage Examples

### Log Authorization Success

```typescript
import { auditAuthorizationSuccess } from '@/middleware/audit-middleware';

await auditAuthorizationSuccess(
  request,
  'user-uuid',
  'client-id',
  'authorization-id',
  ['openid', 'email']
);
```

### Log Authorization Denial

```typescript
import { auditAuthorizationDenial } from '@/middleware/audit-middleware';

await auditAuthorizationDenial(
  request,
  'user-uuid',
  'client-id',
  'authorization-id',
  'user_cancelled'
);
```

### Log Authorization Error

```typescript
import { auditAuthorizationError } from '@/middleware/audit-middleware';

await auditAuthorizationError(
  request,
  'client-id',
  'authorization-id',
  'invalid_request',
  'Missing required parameter: redirect_uri',
  'user-uuid' // Optional
);
```

## Querying Audit Logs

### Get Recent Logs for a User

```typescript
const supabase = createServiceRoleClient();

const { data, error } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('user_id', userId)
  .order('timestamp', { ascending: false })
  .limit(100);
```

### Get Failed Authorization Attempts

```typescript
const { data } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('action', 'authorize_error')
  .order('timestamp', { ascending: false });
```

### Get Logs for a Specific Client

```typescript
const { data } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('client_id', clientId)
  .order('timestamp', { ascending: false });
```

### Get Logs in Date Range

```typescript
const { data } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .gte('timestamp', '2026-01-01T00:00:00Z')
  .lte('timestamp', '2026-01-31T23:59:59Z')
  .order('timestamp', { ascending: false });
```

### Count Events by Action Type

```typescript
const { data } = await supabase
  .from('oauth_audit_log')
  .select('action, count:id.count()')
  .group('action');
```

## Retention Policy

### Automatic Cleanup Function

The migration creates a function `delete_old_audit_logs()` that deletes records older than 90 days.

### Schedule Retention Policy

#### Option 1: pg_cron (if available)

```sql
SELECT cron.schedule(
  'delete-old-audit-logs',
  '0 2 * * *',  -- Run daily at 2 AM
  'SELECT public.delete_old_audit_logs()'
);
```

#### Option 2: GitHub Actions

Create `.github/workflows/cleanup-audit-logs.yml`:

```yaml
name: Cleanup Audit Logs
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Audit Logs
        run: |
          curl -X POST ${{ secrets.CLEANUP_ENDPOINT_URL }} \
            -H "Authorization: Bearer ${{ secrets.CLEANUP_API_KEY }}"
```

#### Option 3: Vercel Cron

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-audit-logs",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Create `/api/cron/cleanup-audit-logs/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Call cleanup function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.rpc('delete_old_audit_logs');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deleted_count: data });
}
```

## Security Considerations

### 1. Service Role Key Protection

- Store in environment variables
- Never expose to client-side code
- Rotate periodically
- Use different keys for dev/staging/production

### 2. PII Handling

- IP addresses are Personally Identifiable Information (PII)
- Ensure GDPR/CCPA compliance
- Consider anonymization if required
- Document data retention policies

### 3. RLS Policies

- Service role writes only (prevents user tampering)
- Admin reads only (customize based on your auth model)
- Users cannot modify logs
- Consider separate admin role in profiles table

### 4. Monitoring

- Set up alerts for unusual patterns
- Track repeated failures (possible attacks)
- Monitor success rates
- Alert on high error rates

## Testing

### Run Tests

```bash
# From platform-hub directory
pnpm test

# Run specific test file
pnpm vitest src/lib/__tests__/audit-log.test.ts

# Run with coverage
pnpm test:coverage
```

### Test Coverage

- ✅ All audit log functions
- ✅ Metadata extraction utilities
- ✅ Error handling
- ✅ Environment validation
- ✅ IP address priority logic
- ✅ Multiple header sources

### Manual Testing

```typescript
// Test audit log write
import { logAuditEvent } from '@/lib/audit-log';

await logAuditEvent({
  user_id: 'test-user',
  client_id: 'test-client',
  action: 'authorize_success',
  metadata: { test: true },
});

// Query and verify
const supabase = createServiceRoleClient();
const { data } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('client_id', 'test-client');

console.log('Audit log entry:', data);
```

## Troubleshooting

### Error: Service role key not configured

**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Error: Failed to write audit log

**Possible Causes**:
1. Service role key is incorrect
2. RLS policies block writes
3. Table doesn't exist

**Solutions**:
1. Verify service role key in Supabase dashboard
2. Check RLS policies allow service role writes
3. Run database migration

### Logs not appearing in queries

**Possible Causes**:
1. Using regular client (not service role)
2. RLS policies block reads
3. Wrong user role

**Solutions**:
1. Use service role client for queries
2. Check RLS policies
3. Add admin role to user profile

### IP address not captured

**Possible Causes**:
1. Running locally (no proxy headers)
2. Wrong header name

**Solutions**:
1. Test in deployed environment
2. Check which headers your deployment uses

## Future Enhancements

1. **Dashboard**: Real-time monitoring UI for audit logs
2. **Alerts**: Email/SMS for suspicious activity
3. **Export**: CSV/JSON export for compliance
4. **Analytics**: ML-based anomaly detection
5. **Extended Metadata**: Device fingerprinting, geolocation
6. **Retention Tiers**: Different retention for different event types
7. **Compliance Reports**: Pre-built GDPR/CCPA compliance reports
8. **Integration**: Send logs to external SIEM systems

## Environment Variables

Required environment variables in `.env.local`:

```bash
# Supabase connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (CRITICAL: Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## References

- Database Migration: `supabase/migrations/20260121172853_create_oauth_audit_log.sql`
- Core Library: `apps/platform-hub/src/lib/audit-log.ts`
- Middleware: `apps/platform-hub/src/middleware/audit-middleware.ts`
- Example API Routes: `apps/platform-hub/src/app/api/oauth/{approve,deny}/route.ts`
- Tests: `apps/platform-hub/src/lib/__tests__/` and `apps/platform-hub/src/middleware/__tests__/`
