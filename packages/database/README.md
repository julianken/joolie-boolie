# @beak-gaming/database

Shared database utilities for the Beak Gaming Platform. Includes typed
Supabase clients, query helpers, pagination utilities, and table-specific
helpers.

## Installation

```json
{
  "dependencies": {
    "@beak-gaming/database": "workspace:*"
  }
}
```

## Public API

Exported from `src/index.ts`:

- Client helpers: `createClient`, `createBrowserClient`, `getServerClientConfig`.
- Types: `Database`, table row/insert/update types, type guards.
- Errors: `DatabaseError` classes + `mapSupabaseError`.
- Pagination: cursor + page helpers.
- Filters: filter/sort helpers and parsers.
- Queries: CRUD helpers like `getById`, `list`, `create`, `update`.
- Table helpers: profiles, templates, sessions, and constants.
- Hooks: `useQuery`, `useMutation`, and related types.

## Basic Usage

```typescript
import { createBrowserClient, listBingoTemplates } from '@beak-gaming/database';

const client = createBrowserClient();
const templates = await listBingoTemplates(client, { limit: 10 });
```

## Testing

```bash
pnpm test:run
```

## Related Docs

- Packages index: [`packages/README.md`](../README.md)
