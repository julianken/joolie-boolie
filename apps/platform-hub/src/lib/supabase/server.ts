import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = validateEnvVariables()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Merge secure cookie options with Supabase defaults
            const secureOptions = {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: options?.path ?? '/',
            }
            cookieStore.set(name, value, secureOptions)
          })
        } catch {
          // Called from Server Component - ignore
        }
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
}
