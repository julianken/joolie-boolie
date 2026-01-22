import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Validates that all required Supabase environment variables are set.
 * Throws descriptive errors if any are missing.
 */
function validateEnvVariables(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL\n' +
      'Expected format: https://your-project-ref.supabase.co\n' +
      'Please add this variable to your .env.local file.'
    )
  }

  if (!anonKey) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Expected format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (JWT token)\n' +
      'Please add this variable to your .env.local file.'
    )
  }

  return { url, anonKey }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { url, anonKey } = validateEnvVariables()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          // Merge secure cookie options with Supabase defaults
          const secureOptions = {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: options?.path ?? '/',
          }
          supabaseResponse.cookies.set(name, value, secureOptions)
        })
      },
    },
    cookieOptions: {
      // Global cookie defaults for all Supabase auth cookies
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  })

  await supabase.auth.getUser()

  return supabaseResponse
}
