/**
 * Supabase Seed Data for E2E Testing
 *
 * Creates test user accounts needed for Playwright E2E tests.
 *
 * IMPORTANT: Both auth.users AND auth.identities must be populated.
 * GoTrue v2 (used by modern Supabase) requires a matching identity row
 * for the "email" provider — without it, signInWithPassword returns
 * "Invalid login credentials" even if the password hash is correct.
 *
 * Run via Supabase CLI:
 *   supabase db reset    # Applies migrations + runs seed.sql
 *   supabase start       # Auto-runs seed.sql on first start
 */

-- =============================================================================
-- E2E test user (used by standard E2E tests with E2E_TESTING=true)
-- Email: e2e-test@joolie-boolie.test
-- Password: TestPassword123!
-- =============================================================================

DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Check if test user already exists
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'e2e-test@joolie-boolie.test';

  -- Only create if user doesn't exist
  IF test_user_id IS NULL THEN
    test_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'e2e-test@joolie-boolie.test',
      crypt('TestPassword123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "E2E Test User"}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- GoTrue v2 requires an identity row for signInWithPassword to work.
    -- Without this, login returns "Invalid login credentials".
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      test_user_id,
      test_user_id,
      jsonb_build_object(
        'sub', test_user_id::text,
        'email', 'e2e-test@joolie-boolie.test',
        'email_verified', true
      ),
      'email',
      test_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    -- Create profile for test user
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (test_user_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created E2E test user: e2e-test@joolie-boolie.test (id: %)', test_user_id;
  ELSE
    RAISE NOTICE 'E2E test user already exists: e2e-test@joolie-boolie.test (id: %)', test_user_id;
  END IF;
END $$;

-- =============================================================================
-- Real-auth test user (used by real-auth E2E tests against local Supabase)
-- Email: real-auth-test@joolie-boolie.test
-- Password: RealAuthTest123!
--
-- This user is used by the `real-auth` Playwright project which runs against
-- local Supabase (Docker) WITHOUT the E2E_TESTING flag, testing real auth paths:
-- - Supabase signInWithPassword (RS256 JWKS verification)
-- - Platform Hub OAuth 2.1 flow (HS256 SUPABASE_JWT_SECRET)
-- - Cross-app SSO cookie propagation
-- =============================================================================

DO $$
DECLARE
  real_auth_user_id uuid;
BEGIN
  -- Check if real-auth test user already exists
  SELECT id INTO real_auth_user_id
  FROM auth.users
  WHERE email = 'real-auth-test@joolie-boolie.test';

  -- Only create if user doesn't exist
  IF real_auth_user_id IS NULL THEN
    real_auth_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      real_auth_user_id,
      '00000000-0000-0000-0000-000000000000',
      'real-auth-test@joolie-boolie.test',
      crypt('RealAuthTest123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Real Auth Test User"}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- GoTrue v2 requires an identity row for signInWithPassword to work.
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      real_auth_user_id,
      real_auth_user_id,
      jsonb_build_object(
        'sub', real_auth_user_id::text,
        'email', 'real-auth-test@joolie-boolie.test',
        'email_verified', true
      ),
      'email',
      real_auth_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    -- Create profile for real-auth test user
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (real_auth_user_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created real-auth test user: real-auth-test@joolie-boolie.test (id: %)', real_auth_user_id;
  ELSE
    RAISE NOTICE 'Real-auth test user already exists: real-auth-test@joolie-boolie.test (id: %)', real_auth_user_id;
  END IF;
END $$;
