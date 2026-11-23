# Browse filter fixes — 16 November 2026

## Implemented behavior

- Switching to a different Product, Vendor or Service tab starts with **only the selected type in the URL**. Search, hierarchy, badge, location, claim status, sort and page are reset. Clicking the current type keeps its filters and pending input.
- Top tabs, desktop sidebar and mobile drawer use the same navigation actions.
- Search/location drafts share a single debounce and merge into the latest navigation target. Ordinary filter changes preserve pending input. Tab changes, Reset, history navigation and unmount cancel pending timers. Intermediate navigation responses cannot overwrite a newer target.
- A stable sidebar component preserves location input focus while typing. Mobile search and its clear button fit inside the viewport.
- Category, subcategory, product type, search, badge, location, claim status and non-default sort have removable chips and are included in the active-filter count. Removing a parent clears its descendants; changing a filter resets pagination.
- Unclaimed badges now send the correct database condition. Legacy `badge=listed` URLs remain supported and normalize to `unclaimed`. Verified badge and claim status remain separate intersecting filters; an impossible combination can legitimately return no matches.
- The former `VERIFIED` claim-status button is labelled **Claimed**. All Statuses is selected when no claim-status filter is applied.
- Browse offers Newest First and Name A–Z. Both use the advertised SQL ordering with stable ID tie breakers. Legacy `sort=eco_score` links normalize to newest. Unsupported badge/location/status facets are removed for the selected type. Existing shared vendor-directory defaults and its explicit Eco Score branch are preserved outside browse.
- Listing/catalog request failures produce an explicit error and Retry action. They do not display “No results” or a misleading zero-result count. Genuine empty results offer Clear all filters. Invalid hierarchy URLs still return no matches; optional vendor-summary failures do not hide products.

No database schema, scoring algorithm, vendor profile categories, product type RLS policy or live records were changed by this fix. The previously reported inactive product type public-read issue remains separate and open.

## Verification

| Layer | Result | Coverage |
| --- | --- | --- |
| Navigation/helper unit tests | 12 named cases pass | All six directions, current-tab no-op, timer cancellation, combined input, normal filter changes, stale-response handling, history, unmount, cascades, pagination and legacy/unsupported facet normalization |
| Actual server/query modules with mocked data/HTTP | 21 cases pass | Parent filters, invalid URLs, SQL query parameters, badge aliases, status intersections, sort orders, pagination/clamping, empty data, fetch failures and optional lookup failures |
| Actual React components in Chrome with mocked HTTP/auth | 61 cases pass | All six directions through top/sidebar controls at 375/768/1440; mobile drawer; chained navigation; Back/Forward; rapid input; focus; chips/counts; request error/Retry; empty state; pagination; visible mobile search-clear control |
| Production app with real public Supabase catalog | 4 cases pass | Computers Product → Vendor → Service, plus pending search during Vendor → Service, at 375px and 1440px |
| TypeScript | Pass | `npx tsc --noEmit`, plus production build's TypeScript stage |
| Production build | Pass | Final source, including the responsive search correction; 113 static pages generated |
| Import regression | Pass | `npm run test:product-import` |
| Focused lint on new modules, server loader and unit tests | Pass | Helpers, navigation store/hook, server page, test and test runner |
| Existing BrowseClient lint | Existing findings remain | 6 errors/12 warnings; before this fix it had 10 errors/12 warnings. Remaining errors are existing explicit `any` and nested pagination-component declarations; warnings are existing unused code and image usage. No new lint rule categories were introduced. |

The real-catalog checks ran against a local production server using the configured public Supabase data: switching showed **3 approved Vendors and 5 approved Services** at verification time. No old Computers category remained in either destination URL. No signed-in session or catalog mutation was used. The mocked browser suite additionally reproduces failures and empty states without editing live records.

The browser fixture now waits for its committed render version rather than assuming a fixed delay is sufficient. That avoids testing stale fixture DOM while compilation is using CPU. Screenshot files show synthetic fixture data.

## Reproduce

From the repository root:

```bash
npm run test:browse-filters
node work/verification/product-types/product-types-browse-test.cjs
node work/verification/product-types/check-product-breadcrumb.cjs
node work/verification/product-types/build-browser-fixture.cjs
node work/verification/product-types/verify-browse-filters-browser.cjs
npm run test:product-import
npx tsc --noEmit
npm run build
```

The breadcrumb rendering script above generates the shared stylesheet used by the isolated browser fixture. Browser fixtures require the already available esbuild and Chrome. Chrome runs needed sandbox approval in this environment; no dependency manifest/lockfile installation was needed.

For the read-only real-catalog checks, start the production app on port 3101, then run:

```bash
npm run start -- --hostname 127.0.0.1 --port 3101
node work/verification/product-types/verify-browse-live.cjs
```

This Next configuration emits a standalone-output advisory for `next start`; it served the tested production routes successfully. The live runner reads `.env.local` for public count comparisons and never prints keys. It performs public browsing/read requests only. It does not change catalog or product records.

Results: `browse-filter-browser-results.json`, `browse-filter-server-results.json`, `browse-filter-live-results.json`, `browse-filter-lint-results.json` and the `browseFilterFixes` section of `summary.json`. Screenshots: `browse-filters-375.png` and `browse-filters-1440.png`. Earlier product-type verification counts in the main report remain historical snapshots.
