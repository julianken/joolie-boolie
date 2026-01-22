/**
 * Authenticated API Client
 *
 * Wrapper around fetch that automatically includes OAuth Bearer token
 * and handles token refresh on 401 responses
 */

import { getValidAccessToken, logout } from './oauth-client';

/**
 * API client error
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Make authenticated API request
 *
 * Automatically includes Bearer token in Authorization header
 * Handles token refresh on 401 responses
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response or throws APIError
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get valid access token (refreshes if expired)
  const token = await getValidAccessToken();

  if (!token) {
    // Unable to get valid token - redirect to login
    logout();
    throw new APIError('Authentication required', 401);
  }

  // Add Bearer token to headers
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (token invalid/revoked)
  if (response.status === 401) {
    // Try to refresh token one more time
    const refreshedToken = await getValidAccessToken();

    if (!refreshedToken) {
      // Refresh failed - redirect to login
      logout();
      throw new APIError('Session expired', 401, response);
    }

    // Retry request with refreshed token
    headers.set('Authorization', `Bearer ${refreshedToken}`);
    const retryResponse = await fetch(url, {
      ...options,
      headers,
    });

    if (retryResponse.status === 401) {
      // Still unauthorized after refresh - logout
      logout();
      throw new APIError('Session expired', 401, retryResponse);
    }

    return retryResponse;
  }

  return response;
}

/**
 * Make authenticated GET request
 *
 * @param url - API endpoint URL
 * @returns JSON response or throws APIError
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new APIError(
      `GET ${url} failed: ${response.statusText}`,
      response.status,
      response
    );
  }

  return response.json();
}

/**
 * Make authenticated POST request
 *
 * @param url - API endpoint URL
 * @param data - Request body (will be JSON.stringified)
 * @returns JSON response or throws APIError
 */
export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new APIError(
      `POST ${url} failed: ${response.statusText}`,
      response.status,
      response
    );
  }

  return response.json();
}

/**
 * Make authenticated PUT request
 *
 * @param url - API endpoint URL
 * @param data - Request body (will be JSON.stringified)
 * @returns JSON response or throws APIError
 */
export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new APIError(
      `PUT ${url} failed: ${response.statusText}`,
      response.status,
      response
    );
  }

  return response.json();
}

/**
 * Make authenticated DELETE request
 *
 * @param url - API endpoint URL
 * @returns JSON response or throws APIError
 */
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new APIError(
      `DELETE ${url} failed: ${response.statusText}`,
      response.status,
      response
    );
  }

  return response.json();
}
