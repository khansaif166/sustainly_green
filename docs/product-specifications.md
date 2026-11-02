# Per-product specifications

Admin and vendor create/edit forms include optional **Product specifications**. Use **Add specification** to add a field name and value (for example, Material / Bamboo or Capacity / 500 ml). Rows can be removed and reordered. Units belong in the value. Entirely empty editor rows are ignored; partially filled rows and duplicate field names must be corrected before saving. Existing products do not need specifications.

Saved specifications appear as a table on the approved product's public detail page, after its description. No section is rendered when there are no specifications. Names and values are rendered as plain text, including multiline values.

## Storage and API

Apply `supabase/migrations/20261102090000_product_specifications.sql` **before deploying the application changes**. The migration adds an ordered `products.specifications` JSONB array, with `[]` as the default for existing/new products, and a database validation constraint. Existing product ownership, approval, and visibility policies apply to this column.

Product POST/PUT requests support:

```json
{"specifications":[{"name":"Material","value":"Bamboo"},{"name":"Capacity","value":"500 ml"}]}
```

Limits: 20 rows, 80 characters per field name, 1,000 per value. Whitespace is trimmed, both fields are required in saved rows, and names must be unique ignoring case. Unsupported properties or malformed values return HTTP 400. Explicit `[]` removes all specifications. Omitting the property preserves existing specifications on updates, supporting older clients. Detail GET responses include the saved array; list queries avoid fetching the specification content.

Specifications are written in the same product INSERT/UPDATE as the rest of the product fields. Vendor edits retain the existing pending-review behavior; admin approval controls work as before. Updates invalidate the existing product detail cache through the current revalidation flow.

The CSV/XLSX import contract is unchanged: it does not accept specification columns. Imported products receive the empty default; specifications can be added afterward through Edit Product.

## Verification

Run `npm run test:product-specifications`, existing import/image tests, TypeScript checks, and the production build. Verify create/edit/load, remove/reorder/clear, validation before photo upload, mobile/keyboard usage, escaped public rendering, API ownership, and database constraint/default compatibility. Applying the migration does not create, delete, or approve products.
