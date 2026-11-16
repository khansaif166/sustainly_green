# Browse filters — final independent recheck

16 November 2026. **All final filter checks passed. No application code was changed during this recheck.**

## Results

| Layer | Final result | Coverage |
| --- | --- | --- |
| Navigation/helper tests | 18 named cases pass | Latest selection, drafts, debounce, six tab directions, Reset, cascades, rapid changes, stale responses, history, pagination and normalization |
| Actual server/query modules with mocked HTTP/data | 21/21 pass | Hierarchy matching/rejection, exact database filters, badge/status combinations, sorting, pagination/clamping, legacy products, empty data and request failures |
| Actual React components in Chrome with mocked HTTP/auth | 79/79 pass | 375/768/1440px, badge dimensions/centering, controls/chips/counts, slow responses, rapid removals, search/location, sidebar focus, sorting, pagination, mobile drawer, history, error/Retry and empty state |
| Real app and configured public Supabase catalog | 21/21 pass | Responses deliberately held during last-filter removal, parent removal, Reset and rapid removals at all three widths; full typed hierarchy count; six tab directions; Back/Forward; search/clear; invalid hierarchy URL |
| Original switching issue against real catalog | 4/4 pass | Computers Product → Vendor → Service and pending search during switching, at 375px and 1440px |
| TypeScript | Pass | `npx tsc --noEmit --incremental false` |
| Focused lint | No new findings | Navigation helpers/hook, server loader and tests are clean. BrowseClient retains the same prior 6 errors and 12 warnings. |
| Whitespace | Pass | `git diff --check` |

These are named cases/groups, not a count of individual assertions. The unit runner reports its compiled test file as one TAP subtest; that file defines the 18 named cases above.

## Real response timing

The real-app Chrome checks intercepted browse route responses at the **response stage**. Before releasing responses, they verified that:

- Chips and counts had already updated, including hiding the badge after the last filter.
- Category removal had cleared subcategory and product type immediately.
- Selected category controls were cleared.
- The result loader was visible and old product cards were absent.
- Rapid removals retained the latest selection after responses completed.

The typed hierarchy returned **1 matching product**, agreeing with a separate public database count. Unfiltered totals at verification time were **12 Products, 5 Services and 3 Vendors**. Switching to a different tab cleared search, sort, page and other selections, and destination counts matched the public database.

## Test environment and limits

- Initial access to localhost:3000 succeeded, but that server stopped during the first real-browser run. Final real-app tests used a temporary Next development server on **localhost:3101**, running the latest workspace source and the configured public catalog. The test server was stopped afterward.
- An initial history assertion ran before the preceding navigation had committed. The test now waits for the outgoing URL before pressing Back; the final full 21-case real-app rerun passed. This required only a test correction.
- All live catalog access was read-only and signed out. No products, catalogs, database schema or API behavior were changed.
- Request-failure/Retry, location combinations and multi-page pagination were covered with controlled component/server fixtures. The current unfiltered live product catalog fits one 12-item page, so multi-page real-data pagination was not exercised.
- A production build was not rerun for this verification-only task. Existing unrelated lint findings remain.

## Evidence

- [Real filter checks](filter-recheck-real-results.json)
- [Real switching checks](filter-recheck-live-navigation-results.json)
- [Component browser checks](filter-recheck-browser-results.json)
- [Server/query checks](filter-recheck-server-results.json)
- [Unit output](filter-recheck-unit.log)
- [Focused lint output](filter-recheck-lint.json)
- [Verified source hashes](filter-recheck-source-hashes.json)

## Reproduce

Run from the repository root. Chrome and the already available esbuild are browser verification prerequisites.

```bash
npm run test:browse-filters
node work/verification/product-types/product-types-browse-test.cjs
node work/verification/product-types/check-product-breadcrumb.cjs
node work/verification/product-types/build-browser-fixture.cjs
node work/verification/product-types/verify-browse-filters-browser.cjs
npx tsc --noEmit --incremental false
npm run dev -- --hostname 127.0.0.1 --port 3101
```

With the temporary server running, execute in another terminal:

```bash
node work/verification/product-types/verify-browse-real-filters.cjs
node work/verification/product-types/verify-browse-live.cjs
```

`BROWSE_TEST_ORIGIN` can select another running local server. `BROWSE_TEST_CASE=Back/Forward` limits the extended real-app runner to its focused history case.
