-- Vendor listing claim support
-- Use this after the initial Sustainly schema.
-- Purpose: import 10k vendor directory listings without creating auth users,
-- then let real users request ownership later.

do $$ begin
  create type public.vendor_claim_status as enum (
    'UNCLAIMED',
    'CLAIM_REQUESTED',
    'CLAIMED',
    'REJECTED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vendor_source as enum (
    'CLIENT_IMPORT',
    'SELF_ONBOARDED',
    'ADMIN_CREATED',
    'FIREBASE_MIGRATION'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vendor_claim_request_status as enum (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  );
exception when duplicate_object then null;
end $$;

alter table public.vendors
  add column if not exists claim_status public.vendor_claim_status not null default 'UNCLAIMED',
  add column if not exists source public.vendor_source not null default 'CLIENT_IMPORT',
  add column if not exists claimed_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists claimed_at timestamptz,
  add column if not exists import_batch_id text,
  add column if not exists listing_verified boolean not null default false,
  add column if not exists public_contact jsonb not null default '{}'::jsonb;

alter table public.vendors
  alter column profile_id drop not null;

alter table public.vendors
  drop constraint if exists vendors_owner_present;

create index if not exists vendors_claim_status_idx on public.vendors (claim_status);
create index if not exists vendors_source_idx on public.vendors (source);
create index if not exists vendors_import_batch_id_idx on public.vendors (import_batch_id);
create index if not exists vendors_claimed_by_profile_id_idx on public.vendors (claimed_by_profile_id);

create table if not exists public.vendor_claims (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,

  requester_name text not null,
  requester_email citext not null,
  requester_phone text,
  requester_designation text,
  company_email citext,
  company_website text,

  proof_documents jsonb not null default '[]'::jsonb,
  message text,
  status public.vendor_claim_request_status not null default 'PENDING',

  reviewed_by_profile_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,

  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_claims_vendor_created_idx on public.vendor_claims (vendor_id, created_at desc);
create index if not exists vendor_claims_profile_created_idx on public.vendor_claims (profile_id, created_at desc);
create index if not exists vendor_claims_status_created_idx on public.vendor_claims (status, created_at desc);
create unique index if not exists vendor_claims_one_pending_per_vendor_profile_idx
  on public.vendor_claims (vendor_id, profile_id)
  where status = 'PENDING' and profile_id is not null;

drop trigger if exists set_vendor_claims_updated_at on public.vendor_claims;
create trigger set_vendor_claims_updated_at
before update on public.vendor_claims
for each row execute function public.set_updated_at();

alter table public.vendor_claims enable row level security;

drop policy if exists "vendor claims requester read" on public.vendor_claims;
create policy "vendor claims requester read" on public.vendor_claims for select
using (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "authenticated create vendor claims" on public.vendor_claims;
create policy "authenticated create vendor claims" on public.vendor_claims for insert
with check (
  auth.role() = 'authenticated'
  and (profile_id = public.current_profile_id() or profile_id is null)
);

drop policy if exists "requester cancels pending vendor claim" on public.vendor_claims;
create policy "requester cancels pending vendor claim" on public.vendor_claims for update
using (
  profile_id = public.current_profile_id()
  and status = 'PENDING'
)
with check (
  profile_id = public.current_profile_id()
  and status = 'CANCELLED'
);

drop policy if exists "admin vendor claims all" on public.vendor_claims;
create policy "admin vendor claims all" on public.vendor_claims for all
using (public.is_admin())
with check (public.is_admin());
