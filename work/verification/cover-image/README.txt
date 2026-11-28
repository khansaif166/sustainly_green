Admin cover image verification — 26 November 2026

Scope: Admin > Vendors > vendor > Rich Profile > Media > Photos and logos.
The shared vendor editor also receives the cover card and replacement flow.

Confirmed problems fixed

1. Replacing the only permitted cover required deleting it first. An invalid
   replacement or failed upload could leave the vendor with no cover.
   Added replace_cover, which uploads a new object and updates the existing
   record under the existing vendor transaction lock. The old object is cleaned
   up after success. Explicit transaction rejection cleans only the new object;
   ambiguous transport failures check the new storage path for a committed row
   and preserve objects that might still be referenced when unconfirmed.

2. Malformed multipart data returned 503. It now returns 400 with an actionable
   upload message. A comparison against HEAD reproduced 503 before the fix.

3. The file picker accepted empty, oversized and unreadable images until a
   server request was attempted. The cover card checks MIME/size and decodes the
   selected image before enabling upload. Unsupported, empty, oversized and
   corrupt files show an inline error without sending an upload request.

4. HTML required validation permitted a whitespace-only title even though the
   server rejected it. Save now requires a nonblank trimmed image description.

5. A successful cover upload followed by a failed editor GET left the displayed
   cover state stale. The save handler now updates the cover record immediately
   and explains separately when the editor refresh fails.

Implemented usability improvements and replacement safeguards

- Dedicated visible cover card, rather than a collapsed generic media form.
- Immediate selected-image preview, pixel dimensions and crop guidance.
- JPG, PNG and WebP / 8 MB guidance and a suggested 1600 x 400 image size.
- Editable image description generated from the filename; a custom description
  survives changing the selected image.
- Explanation of the active/approved profile requirement and banner precedence.
- Failed saves retain the selection for retry. Clear selection allows choosing
  the same file again. Temporary image URLs are released on changes/unmount.
- Per-operation guard and disabled controls prevent duplicate submissions.
- File versions invalidate a previously opened preview after replacement.
- Existing authenticated preview, retry, delete confirmation and read-only
  behavior are retained and tested.

Verification results

- 24 API/auth/storage test groups pass. Actual route handlers, auth checks and
  server media code execute with isolated Supabase HTTP responses. See
  api-results.tap and tests/coverImage.test.mjs.
- 22 Chrome interaction/layout cases pass. Actual RichProfileEditor,
  CoverImageCard, preview component and CSS execute with mocked auth/HTTP.
  Widths: 375, 768 and 1440 px. See browser-results.json.
- 11 database verification groups pass: ten cover-specific groups plus the
  existing rich profile SQL regression suite. Actual migration SQL executes in
  ephemeral PGlite PostgreSQL with stub Supabase auth/storage schemas. See
  database-results.json.
- TypeScript and focused ESLint pass. git diff --check passes.
- Existing vendor creation suite (16 tests) and product image suite pass.
- Production webpack build passed for the initial cover changes, including TypeScript and 117 generated
  pages. The default Turbopack build stalled during compilation and was stopped;
  no successful Turbopack build is claimed. Existing middleware deprecation and
  experimental edge-runtime warnings remain.
- Follow-up network resilience changes pass TypeScript, focused ESLint, the
  expanded 24-group API suite and the 16-test vendor creation regression suite.
  The full production build and browser/database suites were not repeated for
  this server-only follow-up.
- cover-375.png and cover-1440.png show synthetic browser-fixture data.

Follow-up: upload error shown in the user's screenshot

Local server logs recorded TimeoutError and TypeError: fetch failed, both hidden
behind the generic "Rich Profile is temporarily unavailable" response. Read-only
checks confirmed the private vendor-rich bucket and cover table were present.

- Storage uploads now allow 90 seconds and retry once for transient failures.
  Retries reuse the same new UUID path with overwrites disabled. After an
  ambiguous response, stored bytes must match the original SHA-256 digest before
  proceeding. A duplicate response is not accepted without byte verification.
- The database save now allows 30 seconds instead of the default 8 seconds.
  Non-retried service requests now respect a caller-supplied timeout signal.
- If a save response is lost, a read checks the vendor and new storage path for
  the committed record. The mutation is not blindly repeated. An unconfirmed
  result asks the user to reload before retrying.
- Storage failures now have upload-specific messages and stage-specific logs.
- A real temporary PNG (1672 x 941, 4,722,505 bytes) uploaded to private Storage
  with HTTP 200 in 26,044 ms. Readback returned HTTP 200 with identical SHA-256
  in 10,577 ms. Cleanup of that new test object returned HTTP 200. No vendor
  profile was changed by the live test.

Supabase's documented HTTP 400 duplicate behavior was checked against:
https://supabase.com/docs/guides/storage/uploads/standard-uploads

Further improvements suggested

1. Add focal point / crop controls and separate desktop/mobile previews. The
   current crop is illustrative and the public hero width depends on its layout.
2. Resize/compress large images and strip metadata before storage; serve
   appropriately sized images to reduce mobile page load cost.
3. Fully decode images on the server and enforce pixel limits. Server checks
   currently cover MIME, bytes and file signatures; UI checks additionally
   decode the image. Direct API requests bypass the UI decoder.
4. Add conflict detection for simultaneous replacements of the same cover;
   transactions serialize writes, but the last successful replacement wins.
5. Add upload progress and durable cleanup/reconciliation for unreferenced
   objects after ambiguous commits or failed storage cleanup.

Deployment and test limits

Apply supabase/migrations/20261126090000_replace_vendor_cover.sql before
deploying the new replacement UI. This migration replaces the existing write
RPC while preserving its permissions and other profile/media/ad behavior.
The migration has only been applied to the ephemeral verification database.
No existing production records or Storage objects were changed, and no deployment
was made. One temporary private Storage test object was created and deleted.

Browser/API/database suites are isolated tests, supplemented by the real Storage
roundtrip above. No signed-in end-to-end admin save was performed. Cross-session checks cover stale/deleted IDs
and transaction logic, not a real simultaneous multi-connection load test.
Existing unrelated workspace edits were preserved.

Reproduce from the repository root

npm run test:cover-images
node work/verification/cover-image/verify-database.mjs
node work/verification/cover-image/verify-browser.mjs
npx tsc --noEmit --incremental false
npx eslint app/components/rich-vendor/RichProfileEditor.tsx app/components/rich-vendor/CoverImageCard.tsx lib/richVendorServer.ts lib/richVendorProfile.ts tests/coverImage.test.mjs work/verification/cover-image/verify-browser.mjs work/verification/cover-image/verify-database.mjs
npm run test:vendor-creation
npm run test:product-images
npm run build -- --webpack

API tests use the existing TypeScript dependency and Node runner. Browser/SQL
verification additionally uses already-installed esbuild and PGlite plus local
Google Chrome; those are not added to the package manifest or lockfile. Chrome
needs permission to create its startup socket in restricted environments.
