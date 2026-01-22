/**
 * OAuth Token Storage API Route
 *
 * Securely stores and manages OAuth tokens in httpOnly cookies.
 *
 * POST /api/auth/tokens
 * - Stores access_token and refresh_token in httpOnly cookies
 * - Cookies are secure (HTTPS in production), SameSite=Lax (CSRF protection)
 * - Not accessible to JavaScript (XSS protection)
 *
 * DELETE /api/auth/tokens
 * - Clears all OAuth token cookies
 * - Used for logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * OAuth token response from authorization server
 */
interface OAuthTokens {
  /** JWT access token */
  access_token: string;
  /** Opaque refresh token */
  refresh_token: string;
  /** Token type (always 'Bearer') */
  token_type: 'Bearer';
  /** Access token lifetime in seconds */
  expires_in: number;
  /** Space-separated list of granted scopes */
  scope?: string;
}

/**
 * Cookie names for OAuth tokens
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'oauth_access_token',
  REFRESH_TOKEN: 'oauth_refresh_token',
} as const;

/**
 * POST handler - Store OAuth tokens in httpOnly cookies
 *
 * Security measures:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: HTTPS only in production
 * - sameSite: Lax mode (CSRF protection)
 * - path: Root path for all routes
 * - maxAge: Token lifetime (access: 1 hour, refresh: 30 days)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const tokens: OAuthTokens = await request.json();

    // Validate required fields
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json(
        { error: 'Missing required tokens' },
        { status: 400 }
      );
    }

    // Get cookie store
    const cookieStore = await cookies();

    // Store access token
    // Default expiry: 1 hour (can be overridden by expires_in)
    const accessTokenMaxAge = tokens.expires_in || 60 * 60;
    cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: accessTokenMaxAge,
    });

    // Store refresh token
    // Default expiry: 30 days
    cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing tokens:', error);
    return NextResponse.json(
      { error: 'Failed to store tokens' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler - Clear OAuth tokens from cookies
 *
 * Used for:
 * - User logout
 * - Token invalidation
 * - Security cleanup
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();

    // Delete access token cookie
    cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);

    // Delete refresh token cookie
    cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing tokens:', error);
    return NextResponse.json(
      { error: 'Failed to clear tokens' },
      { status: 500 }
    );
  }
}
