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
SUPABASE_SERVICE_ROLE_KEY
```

Do not expose service-role database keys as public variables. `SUPABASE_SERVICE_ROLE_KEY` must be configured only as a Cloudflare Worker secret.

## Notes

- Next.js is built with `next build --webpack` before OpenNext packaging. This avoids the Turbopack build hang seen locally.
- `output: "standalone"` is required for the OpenNext Cloudflare packaging step.
- The app now uses `app/api` route handlers for authenticated Supabase-backed APIs.
- Supabase Storage uploads are still the remaining migration step for real file uploads.
