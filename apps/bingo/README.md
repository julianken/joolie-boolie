This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Before running the development server, you need to set up your environment variables. Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session Token Secret
# Used for HMAC-signing session tokens to provide cryptographic security
# for session management. Generate with: openssl rand -base64 32
SESSION_TOKEN_SECRET=your-secret-here
```

**Generating SESSION_TOKEN_SECRET:**

The `SESSION_TOKEN_SECRET` is a cryptographic key used to sign session tokens. You can generate a secure random string using:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `SESSION_TOKEN_SECRET` in your `.env.local` file.

### Optional Variables

See `.env.example` for additional optional variables like `SUPABASE_SERVICE_ROLE_KEY` for admin operations.

## Getting Started

After setting up your environment variables, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
