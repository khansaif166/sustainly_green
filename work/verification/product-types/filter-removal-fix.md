# Filter count alignment and immediate removal

Implemented on 16 November 2026.

## Behavior

- The count badge has a fixed 20px height, minimum 20px width, centered text and non-shrinking sizing. Sidebar, mobile drawer and mobile button share the same styling.
- Chips, counts, tabs and selected controls use the latest submitted selection immediately. Search/location drafts stay separate until submitted.
- Removing the last filter hides the badge immediately. Removing category/subcategory clears dependent selections immediately. Reset follows the same behavior.
- A result skeleton replaces old cards while the submitted selection is awaiting results. Intermediate responses do not restore removed selections or expose stale cards.
- A failed result response keeps the updated filters and displays the existing error/Retry state.

Changes are in `app/browse/BrowseClient.tsx`, `app/browse/useBrowseNavigation.ts` and `lib/browseNavigation.ts`. Database, APIs and filter matching rules were not changed.

## Verification

| Check | Result |
| --- | --- |
| Navigation/helper tests | 18 named cases pass, including submitted versus draft state, immediate publication, rapid removals, stale responses, no-op Reset and history navigation |
| Actual React components in headless Chrome | 79/79 pass, including the existing navigation regression cases |
| Responsive checks | 375px, 768px and 1440px; one/multiple filters; measured badge dimensions, text centering, heading alignment and non-shrinking sizing |
| Delayed responses | Navigation responses deliberately held; asserted chip/count/control updates and skeleton visibility **before** completing each response |
| Removal and recovery | Last filter, parent cascade, Reset, rapid removals with intermediate responses, unsubmitted search/location drafts, failure and Retry |
| TypeScript | `npx tsc --noEmit --incremental false` passes |
| Focused lint | Navigation store, hook and tests pass. BrowseClient retains its prior 6 errors and 12 warnings: explicit `any`, nested pagination components, unused code and image warnings. No new findings. |
| Diff whitespace check | Pass |

The Chrome fixture runs the actual components with mocked auth/HTTP and manually controlled route-response completion. This is not an authenticated production end-to-end test. Production build and real catalog checks were not rerun for this follow-up; earlier results remain in [browse-filter-fixes.md](browse-filter-fixes.md).

Evidence: [browser results](filter-removal-browser-results.json), [focused lint results](filter-removal-lint.json), [desktop screenshot](filter-removal-1440.png), [mobile screenshot](filter-removal-375.png). Screenshots show synthetic fixture data.

## Reproduce

```bash
npm run test:browse-filters
npx tsc --noEmit --incremental false
npx eslint lib/browseNavigation.ts app/browse/useBrowseNavigation.ts tests/browseFilters.test.ts
node work/verification/product-types/check-product-breadcrumb.cjs
node work/verification/product-types/build-browser-fixture.cjs
node work/verification/product-types/verify-browse-filters-browser.cjs
```

The breadcrumb check generates the stylesheet used by the browser fixture. Chrome and the already available esbuild are verification prerequisites. Chrome required sandbox approval in this environment.
