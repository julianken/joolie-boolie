/**
 * OAuth Approval API Route
 *
 * Handles user approval of OAuth authorization requests.
 * Demonstrates integration of audit logging with OAuth flow.
 *
 * POST /api/oauth/approve
 * Body: { authorization_id: string }
 * Response: { redirect_url: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditAuthorizationSuccess, auditAuthorizationError } from '@/middleware/audit-middleware';

/**
 * Request body schema
 */
interface ApproveRequestBody {
  authorization_id: string;
}

/**
 * POST /api/oauth/approve
 *
 * Approves an OAuth authorization request and logs the event to the audit log.
 *
 * Flow:
 * 1. Validate request body
 * 2. Check user authentication
 * 3. Fetch authorization details from Supabase
 * 4. Approve authorization via Supabase OAuth SDK
 * 5. Log success to audit log
 * 6. Return redirect URL
 *
 * @param request - Next.js request object
 * @returns Response with redirect URL or error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as ApproveRequestBody;
    const { authorization_id } = body;

    // Validate authorization_id
    if (!authorization_id || typeof authorization_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid authorization_id' },
        { status: 400 }
      );
    }

    // Get authenticated user session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to continue' },
        { status: 401 }
      );
    }

    // Fetch authorization details
    const { data: authDetails, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(
      authorization_id
    );

    if (detailsError || !authDetails) {
      // Log error to audit log
      await auditAuthorizationError(
        request,
        'unknown', // client_id may not be available
        authorization_id,
        'fetch_details_failed',
        detailsError?.message || 'Failed to fetch authorization details',
        session.user.id
      );

      return NextResponse.json(
        { error: detailsError?.message || 'Failed to fetch authorization details' },
        { status: 400 }
      );
    }

    const { client } = authDetails;
    // Note: scopes may not be available in Supabase SDK response type
    const scopes = (authDetails as any).scopes || [];

    // Approve authorization via Supabase OAuth SDK
    const { data: approvalData, error: approvalError } = await supabase.auth.oauth.approveAuthorization(
      authorization_id
    );

    if (approvalError || !approvalData?.redirect_url) {
      // Log error to audit log
      await auditAuthorizationError(
        request,
        client.id,
        authorization_id,
        'approval_failed',
        approvalError?.message || 'Approval failed',
        session.user.id
      );

      return NextResponse.json(
        { error: approvalError?.message || 'Failed to approve authorization' },
        { status: 500 }
      );
    }

    // Log success to audit log
    await auditAuthorizationSuccess(
      request,
      session.user.id,
      client.id,
      authorization_id,
      scopes
    );

    // Return redirect URL
    return NextResponse.json({
      redirect_url: approvalData.redirect_url,
    });
  } catch (error) {
    console.error('Error in OAuth approval:', error);

    // Log error (without client_id if not available)
    await auditAuthorizationError(
      request,
      'unknown',
      undefined,
      'internal_error',
      error instanceof Error ? error.message : 'Internal server error'
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
