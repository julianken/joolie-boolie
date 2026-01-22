/**
 * OAuth Authorization Approval API Route
 *
 * This route handles the approval of OAuth authorization requests
 * and logs the action to the audit log.
 *
 * Flow:
 * 1. Validate request and extract authorization_id
 * 2. Get user session
 * 3. Call Supabase OAuth approve method
 * 4. Log approval to audit log
 * 5. Return redirect URL
 *
 * POST /api/oauth/approve
 * Body: { authorization_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditAuthorizationSuccess, auditAuthorizationError } from '@/middleware/audit-middleware';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { authorization_id } = body;

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

    // Get authorization details first to extract client_id and scopes
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

    // Approve authorization
    const { data, error: approveError } = await supabase.auth.oauth.approveAuthorization(
      authorization_id
    );

    if (approveError || !data?.redirect_url) {
      await auditAuthorizationError(
        request,
        session.user.id,
        details.client.id,
        authorization_id,
        approveError?.message || 'Approval failed'
      );

      return NextResponse.json(
        { error: approveError?.message || 'Approval failed' },
        { status: 400 }
      );
    }

    // Extract scopes from details (handle both 'scope' and 'scopes' for compatibility)
    const scopes = Array.isArray((details as any).scopes)
      ? (details as any).scopes
      : typeof (details as any).scope === 'string'
      ? (details as any).scope.split(' ')
      : [];

    // Log successful approval to audit log
    await auditAuthorizationSuccess(
      request,
      session.user.id,
      details.client.id,
      authorization_id,
      scopes
    );

    // Return redirect URL
    return NextResponse.json({
      redirect_url: data.redirect_url,
    });
  } catch (error) {
    console.error('[OAuth Approve] Unexpected error:', error);

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
      console.error('[OAuth Approve] Failed to log audit error:', auditError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
