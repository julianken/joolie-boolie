/**
 * OAuth Authorization Denial API Route
 *
 * This route handles the denial of OAuth authorization requests
 * and logs the action to the audit log.
 *
 * Flow:
 * 1. Validate request and extract authorization_id
 * 2. Get user session
 * 3. Call Supabase OAuth deny method
 * 4. Log denial to audit log
 * 5. Return redirect URL
 *
 * POST /api/oauth/deny
 * Body: { authorization_id: string, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditAuthorizationDenial, auditAuthorizationError } from '@/middleware/audit-middleware';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { authorization_id, reason } = body;

    if (!authorization_id) {
      return NextResponse.json(
        { error: 'Missing authorization_id' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      await auditAuthorizationError(
        request,
        null,
        'unknown',
        authorization_id,
        'Unauthorized: No active session'
      );

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get authorization details first to extract client_id
    const { data: details, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(
      authorization_id
    );

    if (detailsError || !details) {
      await auditAuthorizationError(
        request,
        session.user.id,
        'unknown',
        authorization_id,
        detailsError?.message || 'Failed to fetch authorization details'
      );

      return NextResponse.json(
        { error: 'Failed to fetch authorization details' },
        { status: 400 }
      );
    }

    // Deny authorization
    const { data, error: denyError } = await supabase.auth.oauth.denyAuthorization(
      authorization_id
    );

    if (denyError) {
      await auditAuthorizationError(
        request,
        session.user.id,
        details.client.id,
        authorization_id,
        denyError.message || 'Denial failed'
      );

      return NextResponse.json(
        { error: denyError.message || 'Denial failed' },
        { status: 400 }
      );
    }

    // Log denial to audit log
    await auditAuthorizationDenial(
      request,
      session.user.id,
      details.client.id,
      authorization_id,
      reason || 'user_denied'
    );

    // Return redirect URL (may be undefined if client didn't provide one)
    return NextResponse.json({
      redirect_url: data?.redirect_url || '/dashboard',
    });
  } catch (error) {
    console.error('[OAuth Deny] Unexpected error:', error);

    // Log error to audit log
    try {
      await auditAuthorizationError(
        request,
        null,
        'unknown',
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } catch (auditError) {
      console.error('[OAuth Deny] Failed to log audit error:', auditError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
