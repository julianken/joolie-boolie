# @beak-gaming/auth

Shared authentication utilities for the Beak Gaming Platform. Includes
Supabase client helpers, hooks, and auth-aware components.

## Installation

```json
{
  "dependencies": {
    "@beak-gaming/auth": "workspace:*"
  }
}
```

## Public API

Exported from `src/index.ts`:

- Types: `AuthUser`, `AuthSession`, `AuthConfig`, and auth error types.
- Client helpers: `createClient`, `getClient`, `resetClient`.
- Hooks: `useAuth`, `useSession`, `useUser`.
- Components: `AuthProvider`, `ProtectedRoute`, `GuestOnly`, `withAuth`.

## Basic Usage

```tsx
import { AuthProvider, useAuth, createClient } from '@beak-gaming/auth';

const client = createClient();

function App() {
  return (
    <AuthProvider client={client}>
      <Content />
    </AuthProvider>
  );
}

function Content() {
  const { user, signIn, signOut } = useAuth();
  return <div>{user ? 'Signed in' : 'Signed out'}</div>;
}
```

## Testing

```bash
pnpm test:run
```

## Related Docs

- Packages index: [`packages/README.md`](../README.md)
