# Cloudflare Deployment

This app deploys to Cloudflare Workers using OpenNext.

## Build Commands

Local build/package check:

```bash
npm run cf:build
```

Local Worker preview:

```bash
npm run preview
```

Deploy:

```bash
npm run deploy
```

## Cloudflare Project Settings

Use these settings if connecting the repository in Cloudflare:

```text
Framework preset: None / custom
Build command: npm run cf:build
Deploy command: npm run deploy
Output: handled by OpenNext / Wrangler
```

The Worker config is in `wrangler.jsonc`.

## Required Environment Variables

Set these in Cloudflare, because `.env.local` is local only:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

While the app still uses Firebase, also set:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Do not expose service-role database keys as public variables. Backend-only secrets should be configured as Cloudflare Worker secrets when server APIs are added.

## Notes

- Next.js is built with `next build --webpack` before OpenNext packaging. This avoids the Turbopack build hang seen locally.
- `output: "standalone"` is required for the OpenNext Cloudflare packaging step.
- Current app has no `app/api` routes yet. Future Next route handlers can be deployed through this Worker setup.
