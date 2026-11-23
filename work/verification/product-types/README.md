# Product type verification — 16 November 2026

## Result

**Latest independent recheck:** all 25 real-app checks, 79 component browser checks, 21 server/query checks and 18 named navigation tests pass. See [filter-final-recheck.md](filter-final-recheck.md) for fresh results, real delayed-response verification, test limits and reproduction commands.

**Latest follow-up:** count badges are centered, and filter removal updates chips/counts/controls before the results response. The delayed-response and responsive checks pass. See [filter-removal-fix.md](filter-removal-fix.md) for the 79-case browser run and verification details.

**The full follow-up browse filter fixes are implemented.** See [the current browse filter report](browse-filter-fixes.md) for the reset-all behavior, timing/focus fixes, status/badge/sort corrections, filter chips, error states and current test results. Point 1 (inactive product type public reads) remains open. Original point 2 was not confirmed on the deployment and is documented separately below.

The earlier verification snapshot contained **119 named cases: 117 pass, 2 fail**, including the first partial point 3 fix. Those counts are historical, not totals for the expanded current browse suites. Earlier database/API/spreadsheet results and responsive/detail rendering checks remain preserved.

No live catalog/product records or database migrations were changed by either the verification or browse fixes.

## Latest browse filter fixes

The full browse filter plan is implemented, including **resetting every filter and search when switching to a different type**. This replaces the earlier point 3 behavior that preserved category/search/sort. Clicking the current type keeps selections. Search/location share the latest navigation state, pending input cannot undo Reset/type/history changes, sidebar input focus is stable, all active filters have removable chips/counts, badge/status mapping and labels are corrected, supported sorting is consistent, and request failures display Retry separately from genuine empty results.

See [browse-filter-fixes.md](browse-filter-fixes.md) for current behavior, checks and reproduction commands. The earlier counts and point 3 description below are historical verification snapshots; the latest browse checks are recorded separately.

## Coverage

| Area | Checks performed | Result |
| --- | --- | --- |
| Admin management | Create, rename, move an unused type, activate/deactivate, Cancel, validation, busy state, API errors, confirmation cancel/accept, empty table, accessible delete labels | Pass for the handled 23503 error and user-observed deletion message; alternative-code compatibility concern below |
| Permissions and database | Actual migration application; authenticated admin CRUD; actual vendor/buyer subject restrictions; anonymous reads; duplicate names ignoring case/outer spaces; same name under different parents; blank names; used-type deletion; used type/subcategory move rejection | Pass except inactive public read below |
| Four product forms | Admin/vendor create and edit; parent-dependent choices; clearing after category/subcategory/listing changes; optional type; no inactive new choices; unrelated edit retains existing inactive assignment; submitted type IDs; visible API errors | Pass with mocked HTTP/auth and image/specification editors |
| Product APIs | Actual route handlers; valid UUID type creation/edit round trip; optional type; Service restrictions; malformed/non-string IDs; inactive assignments; mismatched parents; vendor ownership; catalog mapping | Pass with mocked PostgREST/role lookup |
| Spreadsheet parsing | CSV/XLSX type column; generated template and catalog parent references; case/space matching; same-name types within correct parent; missing subcategory; mismatched category; unknown, overlong and ambiguous types; Services; legacy sheets without the column | Pass |
| Import API and commit | Resolved type forwarded by actual prepare handler; invalid name rejected before RPC; actual receipt-aware database commit; admin approved/vendor pending; null type; mismatched type; type deactivated between prepare and commit; idempotent retry; import access restrictions | Pass; preparation HTTP is mocked, commit uses isolated PostgreSQL |
| Browse | Matching child choices; category/subcategory/type URL changes; dependent filter clearing; mobile drawer; pagination links retain hierarchy; actual server rejects invalid URLs without querying products; exact SQL query filters; page range and out-of-range clamping; empty results; Services; UUID/slug categories | Pass; top tabs fixed and rechecked below |
| Product details | Full linked hierarchy; optional type; category only; legacy missing IDs; no category; Service links; placement above title; long names; scoped green link color | Pass except deactivated public label below |
| Responsive UI | Product Types table normal/edit/empty at 375/768/1440; contained horizontal scroll; five columns; long names; actions; centered delete icon; form columns; detail breadcrumb full/long/optional at those widths; all four form selectors; mobile browse drawer at 375/768 | Pass in browser fixtures |

## Feature defects reproduced in isolated checks

### 1. Deactivated product type label disappears from public reads

**Impact:** A published product can lose its product type label/breadcrumb after an admin deactivates its assigned type, despite the existing assignment being retained correctly.

**Source:** `supabase/migrations/20261116090000_product_types.sql:30`.

The RLS expression `p.product_type_id = id` binds the unqualified `id` to the inner products row (`p.id`), rather than the outer product type. The intended approved-product exception therefore does not match normal data.

**Reproduction:** In the isolated database, create an approved product with an active type, deactivate that type, switch to `anon`, then select that type. Expected one visible row; actual zero. New assignments to inactive types remain correctly rejected.

**Evidence:** `db-results.json`, “Public can read inactive type assigned to an approved product”.

### 3. Browse type switching and related filters — FIXED

The full follow-up fix supersedes the earlier change that preserved category/search/sort. Different tabs now reset every filter and search, while clicking the current type keeps its state. Shared navigation also prevents pending search/location work from undoing tab changes, Reset or browser history navigation.

**Evidence:** 61 component browser checks, 21 server/query checks, 12 navigation/helper unit cases, and 4 read-only production-app checks against the real public catalog pass. The live checks show 3 Vendors and 5 Services after the Computers Product → Vendor → Service sequence at mobile/desktop widths. See [the current report](browse-filter-fixes.md) and its result artifacts for details and limits.

## Correction to original point 2: used-item deletion message

**Current result:** The user reports seeing “This item is used by products or child catalog items and cannot be deleted.” This is the intended behavior, and the report no longer counts point 2 as a confirmed deployment issue. No application change is needed for that observed flow.

**Recheck:** The actual DELETE handler at `app/api/admin/master/[resource]/[id]/route.ts:130` handles Supabase error code **23503** by returning **409** with that exact message. The focused API test was strengthened to assert both the status and the full response message; it passes.

**Why the earlier report differed:** The isolated PGlite database emitted **23001** for its `ON DELETE RESTRICT` test. Injecting that alternative code into the actual route handler still yields a generic **503**. This remains a reproducible compatibility concern in the isolated harness, but that code was never observed in a live deletion response. It should not have been presented as a confirmed failure in the user's environment. The configured live database error code has not been captured, so its code must not be inferred as proven from the mocked test.

**Evidence:** `api-results.json` records the passing exact-message 23503 test and the separately failing 23001 compatibility assertion. Database deletion protection itself passes. No live DELETE request or database change was made during the recheck.

## Build and regression gates

### Earlier partial point 3 fix recheck (historical)

- `npx tsc --noEmit` — pass after the fix.
- Browser interaction suite — 49/49 pass using rebuilt actual components with mocked HTTP/auth.
- Browse server/query suite — 10/10 pass.
- Focused ESLint on `BrowseClient.tsx` — 10 errors/12 warnings, identical to the source before this fix (same rules, severities and diagnostic summaries). No new lint findings were introduced. Existing issues include effect state updates, nested component declarations, explicit `any`, unused symbols and `<img>` warnings.
- The full production build below passed during the initial verification and was not rerun for this focused navigation fix.

### Initial verification gates

- `npm run test:product-import` — pass.
- `npm run test:product-specifications` — pass.
- `npm run test:product-images` — pass.
- `npx tsc --noEmit` — pass.
- `npm run build` — pass, including compilation, TypeScript and 113 generated static pages. Existing middleware deprecation/experimental edge runtime warnings remain.
- Focused ESLint on the Product Types page, ProductTypeSelect, taxonomy/type validation, import validation/spreadsheet code, import tests and detail client — fails only on the detail client's pre-existing contact-modal effect (`react-hooks/set-state-in-effect`), with four pre-existing `<img>` warnings. The same error and warnings were reproduced from `HEAD` using ESLint stdin. The other selected files report no issues. This was a focused check, not a claim that full-repository lint is clean.

## Live checks and limits

Read-only checks against the running local app and its configured Supabase instance confirmed:

- Health endpoint returns 200.
- Signed-out catalog/master endpoints reject access with 401.
- Product types table exists and is publicly readable for current active records (four records).
- An existing approved typed product returns its joined product type name; no missing label was observed in the current active live data.
- Active category/subcategory reads succeed.

There was no signed-in admin/vendor browser session available. Consequently these are **not authenticated end-to-end write tests against the deployed Supabase database**. Browser interactions use actual React components with mocked auth/HTTP and image/specification editors. API tests use actual handlers with mocked role lookup/PostgREST. Database constraints, RLS and import commit tests use actual migration SQL in ephemeral PGlite PostgreSQL with stub Supabase auth/storage schemas. They do not test live Storage photo uploads or simultaneous multi-session transactions. Existing image regression tests pass.

## Files and reproduction

Run scripts from the repository root. PGlite, its citext/pgcrypto extensions, esbuild, TypeScript, React and Chrome were already available in this environment; no package manifest or lockfile was changed. PGlite/esbuild are verification prerequisites and are not added as project dependencies here.

```bash
node work/verification/product-types/product-type-db-test.cjs
node work/verification/product-types/product-type-api-test.cjs
node work/verification/product-types/product-types-browse-test.cjs
node work/verification/product-types/product-types-spreadsheet-test.cjs
node work/verification/product-types/check-product-breadcrumb.cjs
node work/verification/product-types/check-product-types-ui.cjs
node work/verification/product-types/build-browser-fixture.cjs
node work/verification/product-types/verify-product-types-interactions.cjs
node work/verification/product-types/verify-product-types-browser.cjs
node work/verification/product-types/verify-product-breadcrumb-browser.cjs
```

The known failing suites intentionally exit nonzero. Browser scripts launch headless Chrome; this environment required sandbox approval to launch it. Fixtures and fresh JSON results are written to `/tmp`; the JSON files next to this report preserve the final observed results. The `.tsx.txt` fixture source is excluded from normal app TypeScript compilation.

`product-types-live-read.cjs` is read-only and reads `.env.local` without printing keys. It additionally requires access to the local app and configured Supabase service. Its temporary snapshot was not copied into this report directory.

Screenshots: `product-types-375.png`, `product-types-1440.png`, `breadcrumb-375.png`, `breadcrumb-1440.png`. These show synthetic fixture data, not an authenticated production session.
