# Authentication Strategy for Platform Hub

## Executive Summary

**Recommended Approach: Option A - Use @joolie-boolie/auth package**

The `@joolie-boolie/auth` package is production-ready, already integrated in the app's root layout, and provides all necessary authentication functionality for the LoginForm. This is the optimal solution.

## Analysis

### Current State

1. **AuthProvider is already configured** in `/Users/j/repos/joolie-boolie-platform/apps/platform-hub/src/app/layout.tsx` (line 6, 40)
2. **LoginForm exists** at `/Users/j/repos/joolie-boolie-platform/apps/platform-hub/src/components/auth/LoginForm.tsx` with placeholder implementation
3. **Login page exists** at `/Users/j/repos/joolie-boolie-platform/apps/platform-hub/src/app/login/page.tsx`
4. **@joolie-boolie/auth** is in dependencies and exports 40+ utilities including `useAuth`, `useUser`, `useSession`, and `AuthProvider`

### Options Evaluation

#### ✅ Option A: Use @joolie-boolie/auth package (RECOMMENDED)

**Pros:**
- Already in dependencies (`package.json` line 17)
- Already wrapped around the app in root layout
- Production-ready (95% complete per `packages/auth/README.md`)
- Provides `useAuth()` hook with `signIn()`, `signUp()`, `signOut()` methods
- Built-in error handling with typed `AuthError` interface
- Consistent with monorepo architecture
- Zero additional setup required

**Cons:**
- None identified

**Complexity:** Simple

#### ❌ Option B: Direct client-side Supabase auth

**Pros:**
- Direct control over Supabase calls
- Uses existing `lib/supabase/client.ts`

**Cons:**
- Duplicates code already in @joolie-boolie/auth
- Violates DRY principle
- Requires manual error handling
- Not reusable across other components
- Inconsistent with monorepo pattern where shared packages exist

**Complexity:** Medium

**Verdict:** Reject - The auth package exists specifically to avoid this approach

#### ❌ Option C: Server action for auth

**Pros:**
- Server-side security

**Cons:**
- Over-engineered for simple email/password login
- Supabase already handles auth on the server via cookies (@supabase/ssr)
- The auth package already handles client-side auth correctly with automatic cookie management
- Adds unnecessary complexity
- Slower UX (round-trip to server for every auth call)

**Complexity:** Complex

**Verdict:** Reject - Not needed when auth package handles this correctly

## Recommended Implementation

### Step 1: Update LoginForm to use useAuth()

**File:** `/Users/j/repos/joolie-boolie-platform/apps/platform-hub/src/components/auth/LoginForm.tsx`

**Changes needed:**

1. Import `useAuth` hook from `@joolie-boolie/auth`
2. Replace the `onSubmit` prop pattern with direct hook usage
3. Remove the placeholder error handling
4. Use the hook's built-in `isLoading` and `error` states

### Step 2: Add redirect logic after successful login

Use Next.js `useRouter` to redirect after successful authentication.

### Step 3: No additional API routes needed

The @joolie-boolie/auth package handles all communication with Supabase directly. No BFF routes are needed for authentication.

## Code Example

Here's the recommended implementation for LoginForm:

```tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@joolie-boolie/ui';
import { useAuth } from '@joolie-boolie/auth';

export interface LoginFormProps {
  /** Optional redirect URL after successful login */
  redirectTo?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const router = useRouter();
  const { signIn, isLoading, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    // Call signIn from useAuth hook
    const { error } = await signIn(email, password);

    if (!error) {
      // Success - redirect to dashboard or home
      router.push(redirectTo);
    }
    // Error handling is automatic via authError state
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* General error message from useAuth */}
      {authError && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-error/10 border-2 border-error text-error text-lg"
        >
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{authError.message}</span>
          </div>
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-lg font-semibold text-foreground mb-2">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`
            w-full px-4 py-4 text-xl rounded-lg border-2
            bg-background text-foreground placeholder:text-muted
            focus:outline-none focus:ring-4 focus:ring-primary/30
            transition-colors duration-150
            ${errors.email ? 'border-error focus:border-error' : 'border-border focus:border-primary'}
          `}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          disabled={isLoading}
        />
        {errors.email && (
          <p id="email-error" className="mt-2 text-lg text-error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password" className="block text-lg font-semibold text-foreground mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`
              w-full px-4 py-4 pr-14 text-xl rounded-lg border-2
              bg-background text-foreground placeholder:text-muted
              focus:outline-none focus:ring-4 focus:ring-primary/30
              transition-colors duration-150
              ${errors.password ? 'border-error focus:border-error' : 'border-border focus:border-primary'}
            `}
            placeholder="Enter your password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isLoading}
          >
            {/* Show/hide password icons - keep existing SVGs */}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-2 text-lg text-error" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Forgot password link */}
      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-lg text-primary hover:text-primary/80 underline focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
        >
          Forgot your password?
        </Link>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        size="lg"
        loading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        Sign In
      </Button>

      {/* Sign up link */}
      <p className="text-center text-lg text-muted-foreground">
        Don't have an account?{' '}
        <Link
          href="/signup"
          className="text-primary hover:text-primary/80 underline font-semibold focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
        >
          Create one now
        </Link>
      </p>
    </form>
  );
}

LoginForm.displayName = 'LoginForm';
```

## Key Changes Summary

1. **Remove `onSubmit` prop** - No longer needed, authentication is handled internally
2. **Import and use `useAuth()` hook** - Provides `signIn`, `isLoading`, `error`
3. **Import and use `useRouter()` hook** - For post-login redirect
4. **Replace local error state for general errors** - Use `authError` from `useAuth()`
5. **Simplify handleSubmit** - Just call `signIn()` and check for errors
6. **Remove placeholder logic** - No more fake delays or placeholder messages

## Dependencies

### Imports needed:
```tsx
import { useAuth } from '@joolie-boolie/auth';
import { useRouter } from 'next/navigation';
```

### No new package dependencies needed:
- `@joolie-boolie/auth` - Already in `package.json`
- `next` - Already in `package.json`

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These should already be configured since the `AuthProvider` is wrapped in the root layout.

## Testing Strategy

### 1. Manual Testing

**Test Case 1: Successful Login**
- Enter valid email and password
- Click "Sign In"
- Verify loading state shows
- Verify redirect to home page (/)
- Verify user is authenticated (check with `useUser()` hook in another component)

**Test Case 2: Invalid Credentials**
- Enter wrong email/password
- Click "Sign In"
- Verify error message displays: "Invalid credentials" or similar
- Verify no redirect occurs
- Verify form remains interactive

**Test Case 3: Validation Errors**
- Submit with empty email
- Verify client-side validation error
- Submit with invalid email format
- Verify format validation error
- Submit with password < 6 chars
- Verify length validation error

**Test Case 4: Loading State**
- Click "Sign In" with valid data
- Verify button shows loading spinner
- Verify form fields are disabled during submission
- Verify loading state clears after response

### 2. Integration Tests (Vitest)

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '@joolie-boolie/auth';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('LoginForm', () => {
  it('calls signIn when form is submitted', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Assert signIn was called or redirect happened
    });
  });
});
```

### 3. E2E Tests (Playwright)

```typescript
test('user can log in successfully', async ({ page }) => {
  await page.goto('http://localhost:3002/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'correct-password');
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('http://localhost:3002/');

  // Verify authenticated state
  await expect(page.locator('text=Sign Out')).toBeVisible();
});
```

## Migration Path

1. **Update LoginForm.tsx** with the code example above
2. **Test locally** with valid Supabase credentials
3. **Update SignupForm.tsx** using the same pattern (use `signUp()` from `useAuth()`)
4. **Update ForgotPasswordForm.tsx** using `resetPassword()` from `useAuth()`
5. **Remove `onSubmit` prop** from all auth form components
6. **Update tests** to use the new implementation

## Risk Assessment

**Low Risk** - This change:
- Uses an existing, production-ready package
- Doesn't introduce new dependencies
- AuthProvider is already integrated
- No server-side changes required
- Easy to test and verify

## Future Enhancements

Once basic auth is working:
- Add OAuth providers (Google, GitHub) using `signInWithOAuth()` from the auth package
- Implement "Remember me" functionality
- Add email verification flow
- Implement session refresh logic (already built into auth package)
- Add protected routes using `<ProtectedRoute>` component from auth package

## References

- **Auth Package README:** `/Users/j/repos/joolie-boolie-platform/packages/auth/README.md`
- **Auth Package Exports:** `/Users/j/repos/joolie-boolie-platform/packages/auth/src/index.ts`
- **useAuth Hook:** `/Users/j/repos/joolie-boolie-platform/packages/auth/src/hooks/use-auth.ts`
- **AuthProvider:** `/Users/j/repos/joolie-boolie-platform/packages/auth/src/components/auth-provider.tsx`
- **Current LoginForm:** `/Users/j/repos/joolie-boolie-platform/apps/platform-hub/src/components/auth/LoginForm.tsx`
