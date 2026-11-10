# Product spreadsheet imports

Available at `/vendor/products/import` and `/admin/products/import`, through the **Bulk Upload** action on each product list.

## Database setup

Apply `supabase/migrations/20261101090000_product_spreadsheet_import.sql` to the development Supabase project after the existing migrations. In Supabase SQL Editor, open that file, paste its full contents, and run it. Use the normal reviewed migration process for production.

The migration adds private batch/row receipts and service-role-only RPCs. It does not change existing products. Without the migration the UI reports a setup error before uploading photos. The app needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`.

## Upload workflow

1. Admins select one vendor for the entire batch; vendor accounts use their own vendor profile.
2. Download the XLSX template, which includes Products, Instructions, and the active Catalog reference. CSV is also available. Replace the sample rows; only the first worksheet is read.
3. Required columns: `title`, `listing_type`, `category_slug`, and `price_type`. Fixed/starting prices require a nonnegative price with at most two decimal places.
4. Use active category slugs, subcategory names belonging to that category, and up to three active tag names. Separate list values with semicolons. Currency defaults to INR; stock defaults to TRUE.
5. Optionally specify exact, case-sensitive filenames in `image_1` through `image_5`, and select all matching local photos together. Duplicate selected filenames are rejected. Unreferenced photos are never uploaded.
6. Correct/remove invalid rows. Preview photos to crop and choose a cover. Review validates/optimizes all referenced photos before confirmation.
7. Confirm the displayed count and publication behavior. Vendor products are pending review; admin products are approved, matching the existing single-product flows.
8. Keep the page open. Resolve failed/unconfirmed rows with Retry. Successful rows are never resubmitted. Download failed rows for correction; unconfirmed saves are deliberately excluded from that export.

Limits: 100 nonempty product rows, 10 MB CSV/XLSX, five photos per product, and 500 selected photo files totaling 200 MB. Use UTF-8 CSV or XLSX. No formula cells, macros, remote image URLs, product updates, vendor IDs, approval/badge fields, or specification columns.

## Reliability and interfaces

Both `/api/vendor/products/import` and `/api/admin/products/import` support GET for the active catalog and POST with `status`, `prepare`, `commit`, and `abort` actions. Each row retains its batch UUID, row UUID, and original ordinal (1–100). Admin prepare requests include the target vendor; vendor requests always derive ownership from the authenticated actor.

Prepare validates the row again and reserves a receipt containing normalized product data and a photo manifest. It returns an attempt UUID and scoped upload paths. Original photo filenames, optimized byte sizes/types, and SHA-256 hashes identify the requested images. The browser processes two rows concurrently, uploading each row's images sequentially without automatic mutation retries.

Commit checks active taxonomy, current role/vendor access, and storage ownership/size/MIME, then writes product, ordered images, tags, and the successful receipt in one PostgreSQL transaction. Repeating a successful row returns its original product ID; different data under an active row identity is rejected. Deleting a created product does not silently recreate it on retry.

An upload failure before commit aborts that attempt under the same batch lock. Cleanup uses the Storage API, only for that attempt's owned/unreferenced files. A new attempt gets a different folder, protecting it from delayed cleanup. A lost commit response preserves images and is resolved by checking the receipt before retrying. Storage cleanup is best effort; failed cleanup and abandoned browser sessions may leave unreferenced files for later administrative reconciliation. Do not delete Storage metadata directly with SQL.

The import session is kept in browser memory. Reloading or starting a new batch creates a new identity and can duplicate products if earlier unconfirmed results were ignored. The UI warns before leaving an unresolved import; no background processing or cross-reload resume is provided in this release.

## Verification and rollout

Run `npm run test:product-import`, `npm run test:product-images`, `npx tsc --noEmit`, and `npm run cf:build` with the environment configured. The import tests cover parsing, taxonomy/prices/files, formula handling, row limits, CSV export, retry recovery, cleanup ordering, and two-row concurrency.

Before release, apply the migration to a development database, verify vendor/admin imports with local photos, simulate a lost save response and retry, and confirm exactly one product with complete image/tag records. Check API rejection for buyer/unauthenticated accounts and vendor ownership tampering.

Deploy the additive migration before the application. Roll back the application if necessary while retaining receipts, products, and RPCs for in-flight recovery. Never remove receipt tables while users still need to resolve imports. Monitor the `PRODUCT_IMPORT_ERROR` log marker and row-level failed/unconfirmed results; logs omit credentials and complete spreadsheet rows.
