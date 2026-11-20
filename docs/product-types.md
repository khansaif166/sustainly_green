# Product types

Product listings can now be classified as Category → Subcategory → Product type. Product type is optional; Service listings do not use it. Existing products have no type until an admin or vendor assigns one.

## Database rollout

Apply `supabase/migrations/20261116090000_product_types.sql` after the spreadsheet import migration and before deploying the app. The migration adds the type catalog, product foreign key, public/admin policies, hierarchy checks, and the updated import commit function. It does not seed types or change existing product classifications.

Admins add types under `/admin/product-types`. A used type cannot be deleted or moved to another subcategory; deactivate it to stop new assignments while preserving existing products. A used subcategory cannot move to another category. Inactive types already assigned to a product remain visible and can be kept during unrelated edits.

## Interfaces

Product create/edit requests accept optional `productTypeId`. The admin and vendor catalog responses include `productTypes`. Imports accept optional `product_type_name` only for Product rows that also specify a matching `subcategory_name`. Public browse uses `category`, `subcategory`, and `product_type` query parameters; invalid combinations return no results.

## Checks

Run `npm run test:product-import`, `npx tsc --noEmit`, and `npm run build`. In a development database, verify admin type management, vendor/admin Product and Service saves, bulk upload, public browse filters, and a legacy product with no type before production rollout.
