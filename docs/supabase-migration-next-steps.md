# Supabase Migration Next Steps

The Supabase schema is in `supabase/migrations/20260623055559_initial_sustainly_schema.sql`.

Do not delete Firebase data or switch the live app until every verification step below passes.

## What Exists Now

- A typed Supabase/Postgres schema for the current Firebase data model.
- Legacy Firebase ID columns on migrated entities:
  - `legacy_firebase_uid` for auth-owned profile records.
  - `legacy_firebase_id` for Firestore auto-ID records.
  - `legacy_*_firebase_id` reference columns for relationship reconciliation.
- `raw_firebase jsonb` columns on major tables to preserve the original Firestore document during migration.
- RLS policies for public, buyer, vendor, and admin access.
- Storage buckets:
  - `marketplace`
  - `vendor-private`
  - `resumes`

## Safe Migration Order

1. Backup Firebase before touching app code.
2. Export Firestore collections to JSON/NDJSON.
3. Export Firebase Storage file list and download/upload files into Supabase Storage.
4. Create Supabase Auth users or map existing users.
5. Import `profiles` first from Firestore `users`.
6. Import `vendors` and `buyers`.
7. Import categories, subcategories, tags, certifications, certifying bodies.
8. Import products, product images, and product tag joins.
9. Import RFQs.
10. Import blogs, careers, job applications, and settings.
11. Run reconciliation checks.
12. Add a read-only Supabase data layer in the app.
13. Compare Firebase vs Supabase page outputs.
14. Move writes one workflow at a time.
15. Cut over only after explicit approval.

## Required Reconciliation Checks

Run these checks before cutover:

```text
Firebase users count == Supabase profiles count
Firebase vendors count == Supabase vendors count
Firebase buyers count == Supabase buyers count
Firebase products count == Supabase products count
Firebase rfqs count == Supabase rfqs count
Firebase categories count == Supabase categories count
Firebase subcategories count == Supabase subcategories count
Firebase tags count == Supabase sustainability_tags count
Firebase blogs count == Supabase blogs count
Firebase careers count == Supabase careers count
Firebase jobApplications count == Supabase job_applications count
```

Also manually verify:

- 5 random vendors and their logos/certificates.
- 5 random buyers and their nested profile fields.
- 10 random products with images, categories, subcategories, and tags.
- 10 random RFQs with buyer/vendor/product references.
- 5 random job applications with resume links.
- Homepage banner setting.
- Admin approval queues.
- Buyer dashboard.
- Vendor dashboard.

## Important Identity Note

Do not assume Supabase Auth UUIDs will match Firebase UIDs.

The schema separates:

```text
profiles.auth_user_id        -> Supabase auth.users.id
profiles.legacy_firebase_uid -> old Firebase Auth UID
```

This lets us migrate data safely even if auth users are recreated in Supabase.

## Applying The Schema

If you have Supabase CLI linked to the new project:

```bash
supabase db push
```

If you are using the Supabase dashboard:

1. Open Supabase project.
2. Go to SQL Editor.
3. Open `supabase/migrations/20260623055559_initial_sustainly_schema.sql`.
4. Paste and run it.

After the schema is applied, do not import data manually by guessing columns. Build or run a controlled import script that writes legacy IDs and raw Firebase JSON.
