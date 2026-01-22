# BEA-285: OAuth Audit Logging Implementation

## Summary

This document describes the complete implementation of the OAuth audit logging system for the Platform Hub. The system tracks all OAuth authorization events (approvals, denials, errors) with full metadata including IP addresses, user agents, and custom context.

## Files Created

### 1. Database Migration
**File:** `supabase/migrations/20260121172136_create_oauth_audit_log.sql` (66 lines)

Creates the `oauth_audit_log` table with:
- Primary key (UUID)
- Timestamp tracking
- User and client references
- Action type (enum constraint)
- IP address (INET type)
- User agent (text)
- Metadata (JSONB for flexibility)
- Indexes on frequently queried columns
- Row Level Security (RLS) policies
- 90-day retention policy function

**Action Types:**
- `authorize_success` - User approved authorization
- `authorize_deny` - User denied authorization
- `authorize_error` - Error during authorization flow
- `token_exchange` - Authorization code exchanged for token
- `token_refresh` - Refresh token used
- `token_revoke` - Token revoked

**Security Features:**
- Service role only writes (prevents tampering)
- Admin-only reads (configurable via RLS)
- Automatic cleanup function for 90-day retention

### 2. Audit Logging Library
**File:** `apps/platform-hub/src/lib/audit-log.ts` (317 lines)

Core logging functions using service role client:

**Main Functions:**
- `logAuditEvent(entry)` - Generic audit log writer
- `logAuthorizationSuccess(...)` - Log successful authorizations
- `logAuthorizationDenial(...)` - Log authorization denials
- `logAuthorizationError(...)` - Log errors during authorization
- `logTokenExchange(...)` - Log token exchanges
- `logTokenRefresh(...)` - Log token refreshes
- `logTokenRevoke(...)` - Log token revocations

**Features:**
- Type-safe with TypeScript
- Service role client (bypasses RLS)
- Environment variable validation
- Error handling and logging
- Flexible metadata support

### 3. Middleware Utilities
**File:** `apps/platform-hub/src/middleware/audit-middleware.ts` (183 lines)

Helper functions for request metadata extraction:

**Metadata Extraction:**
- `extractIpAddress(request)` - Extract IP from multiple header sources
- `extractUserAgent(request)` - Extract user agent
- `extractRequestMetadata(request)` - Extract all metadata

**High-Level Wrappers:**
- `auditAuthorizationSuccess(request, ...)` - Log success with auto metadata
- `auditAuthorizationDenial(request, ...)` - Log denial with auto metadata
- `auditAuthorizationError(request, ...)` - Log error with auto metadata

**IP Address Priority:**
1. `x-forwarded-for` (proxies/load balancers)
2. `x-real-ip` (nginx)
3. `x-vercel-forwarded-for` (Vercel)

### 4. API Routes (Example Implementation)
**Files:**
- `apps/platform-hub/src/app/api/oauth/approve/route.ts` (110 lines)
- `apps/platform-hub/src/app/api/oauth/deny/route.ts` (110 lines)

API routes demonstrating integration:

**POST /api/oauth/approve**
- Validates authorization_id
- Checks user authentication
- Fetches authorization details
- Calls Supabase OAuth approve
- Logs success/error to audit log
- Returns redirect URL

**POST /api/oauth/deny**
- Validates authorization_id
- Checks user authentication
- Fetches authorization details
- Calls Supabase OAuth deny
- Logs denial to audit log
- Returns redirect URL

**Request Body:**
```json
{
  "authorization_id": "uuid",
  "reason": "optional-denial-reason"
}
```

**Response:**
```json
{
  "redirect_url": "https://client.com/callback?code=..."
}
```

### 5. Tests
**Files:**
- `apps/platform-hub/src/lib/__tests__/audit-log.test.ts` (171 lines)
- `apps/platform-hub/src/middleware/__tests__/audit-middleware.test.ts` (194 lines)

Comprehensive test coverage:

**Audit Log Tests:**
- Log all event types
- Helper function tests
- Error handling tests
- Environment variable validation

**Middleware Tests:**
- IP extraction from various headers
- User agent extraction
- Metadata extraction
- Wrapper function integration

### 6. Documentation
**File:** `apps/platform-hub/src/lib/AUDIT_LOG_README.md` (449 lines)

Comprehensive documentation including:
- System overview
- Component descriptions
- Integration guides (2 approaches)
- Query examples
- Retention policy setup
- Security considerations
- Testing examples
- Troubleshooting guide
- Future enhancements

## Architecture

### Data Flow

```
1. User Action (Approve/Deny)
   ↓
2. API Route Handler
   ↓
3. Supabase OAuth SDK Call
   ↓
4. Extract Request Metadata (IP, User Agent)
   ↓
5. Log to Audit Log (Service Role Client)
   ↓
6. Return Response to Client
```

### Security Model

1. **Write Access:** Service role only (application-controlled)
2. **Read Access:** Admin users only (configurable RLS)
3. **Environment Isolation:** Service role key server-side only
4. **Tamper Prevention:** Users cannot modify their own logs

### Integration Approaches

#### Option A: API Routes (Recommended)
- Client calls `/api/oauth/approve` or `/api/oauth/deny`
- API routes handle OAuth flow + audit logging
- Clean separation of concerns
- Easy to test and maintain

#### Option B: Server Components/Actions
- Direct integration in Server Components
- Server Actions for form submissions
- Requires manual request metadata extraction
- More complex but fewer network hops

## Database Schema

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

## Usage Examples

### Log Authorization Success

```typescript
import { auditAuthorizationSuccess } from '@/middleware/audit-middleware';

// In API route
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
  'user_denied'
);
```

### Query Audit Logs

```typescript
// Get all logs for a user
const { data } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('user_id', userId)
  .order('timestamp', { ascending: false });

// Get failed attempts
const { data } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('action', 'authorize_error')
  .order('timestamp', { ascending: false });
```

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

## Deployment Steps

### 1. Apply Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually apply
psql -f supabase/migrations/20260121172136_create_oauth_audit_log.sql
```

### 2. Configure Environment Variables

Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**CRITICAL:** Never expose service role key to client-side code!

### 3. Update OAuth Consent Flow

Choose integration approach:

**Option A: API Routes**
```typescript
// Update consent page to use API routes
const handleApprove = async () => {
  const response = await fetch('/api/oauth/approve', {
    method: 'POST',
    body: JSON.stringify({ authorization_id })
  });
};
```

**Option B: Server Actions**
```typescript
// Add audit logging to existing Server Actions
await auditAuthorizationSuccess(request, ...);
```

### 4. Set Up Retention Policy

**Option 1: pg_cron (if available)**
```sql
SELECT cron.schedule(
  'delete-old-audit-logs',
  '0 2 * * *',
  'SELECT public.delete_old_audit_logs()'
);
```

**Option 2: External Scheduler**
- GitHub Actions cron job
- Vercel Cron job
- AWS EventBridge
- Call `/api/cron/cleanup-audit-logs`

### 5. Verify Installation

```typescript
// Test audit log write
await logAuditEvent({
  user_id: 'test-user',
  client_id: 'test-client',
  action: 'authorize_success',
  metadata: { test: true }
});

// Query and verify
const { data } = await supabase
  .from('oauth_audit_log')
  .select('*')
  .eq('client_id', 'test-client');
```

## Acceptance Criteria

- ✅ Database table `oauth_audit_log` created
- ✅ Middleware logs all authorization attempts (approve/deny)
- ✅ Logs include: timestamp, user_id, client_id, action, IP, user agent
- ✅ Failed attempts logged separately (authorize_error action)
- ✅ 90-day retention policy configured (function created)
- ✅ API routes demonstrate integration
- ✅ Tests written and passing
- ✅ Comprehensive documentation provided

## Security Considerations

1. **Service Role Key Protection**
   - Store in environment variables
   - Never expose to client-side
   - Rotate periodically

2. **PII Handling**
   - IP addresses are PII
   - Ensure GDPR/CCPA compliance
   - Consider anonymization if required

3. **RLS Policies**
   - Service role writes only
   - Admin reads only
   - Users cannot modify logs

4. **Monitoring**
   - Set up alerts for unusual patterns
   - Track repeated failures
   - Monitor success rates

## Future Enhancements

1. **Dashboard**: Real-time monitoring UI
2. **Alerts**: Email/SMS for suspicious activity
3. **Export**: CSV/JSON export for compliance
4. **Analytics**: ML-based anomaly detection
5. **Extended Metadata**: Device fingerprinting, geolocation

## Troubleshooting

### Error: Service role key not configured
Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### Error: Failed to write audit log
1. Verify service role key is correct
2. Check RLS policies
3. Verify table exists

### Logs not appearing
1. Use service role client to query
2. Check database logs for errors
3. Verify RLS policies allow reads

## References

- Database Migration: `supabase/migrations/20260121172136_create_oauth_audit_log.sql`
- Core Library: `apps/platform-hub/src/lib/audit-log.ts`
- Middleware: `apps/platform-hub/src/middleware/audit-middleware.ts`
- Documentation: `apps/platform-hub/src/lib/AUDIT_LOG_README.md`
- Tests: `apps/platform-hub/src/lib/__tests__/` and `apps/platform-hub/src/middleware/__tests__/`
