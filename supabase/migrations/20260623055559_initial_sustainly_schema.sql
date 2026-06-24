-- Sustainly initial Supabase schema
-- Safe migration principle:
-- Firebase remains source of truth until export/import/reconciliation is complete.
-- Every migrated entity keeps legacy Firebase identifiers for audit and rollback.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.app_role as enum ('ADMIN', 'BUYER', 'VENDOR');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_status as enum ('draft', 'submitted', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.rfq_status as enum ('RFQ_REQUESTED', 'VENDOR_RESPONDED', 'QUOTED', 'ACCEPTED', 'CONTACT_SHARED', 'CLOSED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.certification_request_status as enum ('NEW', 'REQUESTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ad_status as enum ('PENDING', 'APPROVED', 'REJECTED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_application_status as enum ('NEW', 'REVIEWED', 'SHORTLISTED', 'REJECTED');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Shared trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles and role-owned entities
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  legacy_firebase_uid text unique,

  name text not null,
  email citext not null,
  role public.app_role not null,
  email_verified boolean not null default false,

  company_name text,
  buyer_profile_complete boolean not null default false,
  buyer_approved boolean not null default false,
  vendor_profile_complete boolean not null default false,
  vendor_approved boolean not null default false,
  disabled boolean not null default false,

  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_identity_present check (auth_user_id is not null or legacy_firebase_uid is not null)
);

create unique index if not exists profiles_email_unique_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  legacy_firebase_uid text unique,

  company_name text not null,
  logo_url text,
  registration_type text,
  cin_registration text,
  gst_number text,
  year_of_incorporation text,
  registered_address text,
  city text,
  state text,
  pin_code text,
  country text,

  primary_contact_name text,
  designation text,
  business_email citext,
  whatsapp text,
  alternate_phone text,

  business_type text,
  primary_category text,
  sub_categories text[] not null default '{}',
  short_description text,
  key_products text[] not null default '{}',
  target_industries text,
  preferred_buyer_geography text,
  supply_capacity text,
  moq text,
  export_capability boolean not null default false,
  export_markets text,

  primary_sustainability_cert text,
  issuing_body text,
  certificate_file_url text,
  additional_certs jsonb not null default '[]'::jsonb,
  sustainability_practice text,
  recycled_content text,
  carbon_footprint text,
  epr_registration text,
  social_compliance text,
  net_zero_commitment text,

  listing_tier text,
  case_studies text,
  awards text,
  awards_image_url text,
  looking_for_buyers_in text,
  willingness_to_offer_samples boolean not null default false,
  payment_terms text,
  language text,

  eco_score jsonb not null default '{}'::jsonb,
  declaration jsonb not null default '{}'::jsonb,

  approved boolean not null default false,
  status public.review_status not null default 'submitted',
  approved_at timestamptz,

  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vendors_owner_present check (profile_id is not null or legacy_firebase_uid is not null)
);

create index if not exists vendors_approved_company_idx on public.vendors (approved, company_name);
create index if not exists vendors_primary_category_approved_idx on public.vendors (primary_category, approved);
create index if not exists vendors_created_at_idx on public.vendors (created_at desc);

create table if not exists public.buyers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  legacy_firebase_uid text unique,

  company_info jsonb not null default '{}'::jsonb,
  business_overview jsonb not null default '{}'::jsonb,
  sustainability jsonb not null default '{}'::jsonb,
  procurement jsonb not null default '{}'::jsonb,
  segment_details jsonb not null default '{}'::jsonb,
  declaration jsonb not null default '{}'::jsonb,

  approved boolean not null default false,
  status public.review_status not null default 'submitted',
  approved_at timestamptz,

  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint buyers_owner_present check (profile_id is not null or legacy_firebase_uid is not null)
);

create index if not exists buyers_approved_idx on public.buyers (approved);
create index if not exists buyers_status_updated_at_idx on public.buyers (status, updated_at desc);
create index if not exists buyers_created_at_idx on public.buyers (created_at desc);

-- ---------------------------------------------------------------------------
-- Marketplace master data
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  name text not null,
  slug text not null unique,
  image_url text,
  active boolean not null default true,
  sort_order integer,
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_active_sort_idx on public.categories (active, sort_order);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  category_id uuid not null references public.categories(id) on delete restrict,
  legacy_category_firebase_id text,
  name text not null,
  active boolean not null default true,
  sort_order integer,
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subcategories_category_active_idx on public.subcategories (category_id, active);

create table if not exists public.sustainability_tags (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  name text not null,
  active boolean not null default true,
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sustainability_tags_name_unique_idx on public.sustainability_tags (lower(name));
create index if not exists sustainability_tags_active_idx on public.sustainability_tags (active);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,

  vendor_id uuid not null references public.vendors(id) on delete cascade,
  legacy_vendor_firebase_uid text,
  vendor_name text not null,

  title text not null,
  description text,

  listing_type text,
  available_for text[] not null default '{}',

  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  legacy_category_firebase_id text,
  legacy_subcategory_firebase_id text,

  price_type text,
  price numeric(14,2),
  currency text not null default 'INR',
  moq numeric(14,2),
  discount text,

  ship_regions text[] not null default '{}',
  in_stock boolean not null default true,

  featured boolean not null default false,
  is_ad boolean not null default false,
  ad_status public.ad_status,
  ad_active boolean not null default false,
  ad_placement text,
  ad_position text,
  impressions integer not null default 0,
  clicks integer not null default 0,
  budget numeric(14,2),
  ad_started_at timestamptz,
  ad_ends_at timestamptz,

  sustainability_claim text,
  approved boolean not null default false,
  status public.product_status not null default 'PENDING',

  views integer not null default 0,
  last_viewed_at timestamptz,

  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_approved_created_idx on public.products (approved, created_at desc);
create index if not exists products_approved_category_title_idx on public.products (approved, category_id, title);
create index if not exists products_vendor_created_idx on public.products (vendor_id, created_at desc);
create index if not exists products_vendor_status_created_idx on public.products (vendor_id, status, created_at desc);
create index if not exists products_status_created_idx on public.products (status, created_at desc);
create index if not exists products_featured_approved_created_idx on public.products (featured, approved, created_at desc);
create index if not exists products_is_ad_approved_idx on public.products (is_ad, approved);
create index if not exists products_listing_type_approved_category_title_idx on public.products (listing_type, approved, category_id, title);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  legacy_firebase_url text,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_sort_idx on public.product_images (product_id, sort_order);

create table if not exists public.product_sustainability_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.sustainability_tags(id) on delete restrict,
  legacy_tag_firebase_id text,
  tag_name_snapshot text not null,
  primary key (product_id, tag_id)
);

create index if not exists product_sustainability_tags_tag_idx on public.product_sustainability_tags (tag_id);

-- ---------------------------------------------------------------------------
-- RFQs
-- ---------------------------------------------------------------------------

create table if not exists public.rfqs (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,

  buyer_id uuid references public.buyers(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,

  legacy_buyer_firebase_uid text,
  legacy_vendor_firebase_uid text,
  legacy_product_firebase_id text,

  requirement_title text not null,
  requirement_type text,
  category text,
  estimated_quantity text,
  delivery_country text,
  required_timeline text,
  additional_details text,

  buyer_name text not null,
  buyer_email citext not null,
  buyer_phone text,

  status public.rfq_status not null default 'RFQ_REQUESTED',
  contact_shared boolean not null default false,
  vendor_response jsonb not null default '{}'::jsonb,
  vendor_contact jsonb not null default '{}'::jsonb,
  responded_at timestamptz,

  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rfqs_buyer_created_idx on public.rfqs (buyer_id, created_at desc);
create index if not exists rfqs_vendor_created_idx on public.rfqs (vendor_id, created_at desc);
create index if not exists rfqs_vendor_status_created_idx on public.rfqs (vendor_id, status, created_at desc);
create index if not exists rfqs_buyer_email_created_idx on public.rfqs (buyer_email, created_at desc);
create index if not exists rfqs_status_created_idx on public.rfqs (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Content and hiring
-- ---------------------------------------------------------------------------

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  title text not null,
  slug text unique,
  excerpt text,
  content text,
  image_url text,
  published boolean not null default true,
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blogs_published_created_idx on public.blogs (published, created_at desc);

create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  title text not null,
  department text,
  location text,
  employment_type text,
  description text,
  active boolean not null default true,
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists careers_active_created_idx on public.careers (active, created_at desc);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  career_id uuid references public.careers(id) on delete set null,
  legacy_career_firebase_id text,
  job_title text,
  name text not null,
  email citext not null,
  phone text,
  resume_url text,
  resume_storage_path text,
  status public.job_application_status not null default 'NEW',
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_applications_career_created_idx on public.job_applications (career_id, created_at desc);
create index if not exists job_applications_status_created_idx on public.job_applications (status, created_at desc);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  raw_firebase jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Certifications
-- ---------------------------------------------------------------------------

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  legacy_collection_name text,
  name text not null,
  description text,
  country text,
  status text not null default 'Active',
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certifications_status_name_idx on public.certifications (status, name);

create table if not exists public.certifying_bodies (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  name text not null,
  description text,
  country text,
  status text not null default 'Active',
  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certifying_bodies_status_name_idx on public.certifying_bodies (status, name);

create table if not exists public.certification_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  legacy_collection_name text,

  vendor_id uuid references public.vendors(id) on delete set null,
  certification_id uuid references public.certifications(id) on delete set null,

  legacy_vendor_firebase_uid text,
  legacy_certification_firebase_id text,

  company_name text,
  email citext,
  phone text,
  certification_name text,
  message text,
  status public.certification_request_status not null default 'NEW',

  raw_firebase jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certification_requests_vendor_created_idx on public.certification_requests (vendor_id, created_at desc);
create index if not exists certification_requests_status_created_idx on public.certification_requests (status, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_vendors_updated_at on public.vendors;
create trigger set_vendors_updated_at before update on public.vendors for each row execute function public.set_updated_at();

drop trigger if exists set_buyers_updated_at on public.buyers;
create trigger set_buyers_updated_at before update on public.buyers for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

drop trigger if exists set_subcategories_updated_at on public.subcategories;
create trigger set_subcategories_updated_at before update on public.subcategories for each row execute function public.set_updated_at();

drop trigger if exists set_sustainability_tags_updated_at on public.sustainability_tags;
create trigger set_sustainability_tags_updated_at before update on public.sustainability_tags for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists set_rfqs_updated_at on public.rfqs;
create trigger set_rfqs_updated_at before update on public.rfqs for each row execute function public.set_updated_at();

drop trigger if exists set_blogs_updated_at on public.blogs;
create trigger set_blogs_updated_at before update on public.blogs for each row execute function public.set_updated_at();

drop trigger if exists set_careers_updated_at on public.careers;
create trigger set_careers_updated_at before update on public.careers for each row execute function public.set_updated_at();

drop trigger if exists set_job_applications_updated_at on public.job_applications;
create trigger set_job_applications_updated_at before update on public.job_applications for each row execute function public.set_updated_at();

drop trigger if exists set_certifications_updated_at on public.certifications;
create trigger set_certifications_updated_at before update on public.certifications for each row execute function public.set_updated_at();

drop trigger if exists set_certifying_bodies_updated_at on public.certifying_bodies;
create trigger set_certifying_bodies_updated_at before update on public.certifying_bodies for each row execute function public.set_updated_at();

drop trigger if exists set_certification_requests_updated_at on public.certification_requests;
create trigger set_certification_requests_updated_at before update on public.certification_requests for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() and disabled = false limit 1
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() and disabled = false limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'ADMIN', false)
$$;

create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.vendors where profile_id = public.current_profile_id() limit 1
$$;

create or replace function public.current_buyer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.buyers where profile_id = public.current_profile_id() limit 1
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.buyers enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.sustainability_tags enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sustainability_tags enable row level security;
alter table public.rfqs enable row level security;
alter table public.blogs enable row level security;
alter table public.careers enable row level security;
alter table public.job_applications enable row level security;
alter table public.site_settings enable row level security;
alter table public.certifications enable row level security;
alter table public.certifying_bodies enable row level security;
alter table public.certification_requests enable row level security;

drop policy if exists "profiles self or admin read" on public.profiles;
create policy "profiles self or admin read" on public.profiles for select
using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert
with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
using (auth_user_id = auth.uid() or public.is_admin())
with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "public read approved vendors" on public.vendors;
create policy "public read approved vendors" on public.vendors for select
using (approved = true or profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "vendor self update" on public.vendors;
create policy "vendor self update" on public.vendors for update
using (profile_id = public.current_profile_id() or public.is_admin())
with check (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "vendor self insert" on public.vendors;
create policy "vendor self insert" on public.vendors for insert
with check (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "admin vendors all" on public.vendors;
create policy "admin vendors all" on public.vendors for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "buyer self or admin read" on public.buyers;
create policy "buyer self or admin read" on public.buyers for select
using (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "buyer self update" on public.buyers;
create policy "buyer self update" on public.buyers for update
using (profile_id = public.current_profile_id() or public.is_admin())
with check (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "buyer self insert" on public.buyers;
create policy "buyer self insert" on public.buyers for insert
with check (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "admin buyers all" on public.buyers;
create policy "admin buyers all" on public.buyers for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories" on public.categories for select using (active = true or public.is_admin());

drop policy if exists "admin categories all" on public.categories;
create policy "admin categories all" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read active subcategories" on public.subcategories;
create policy "public read active subcategories" on public.subcategories for select using (active = true or public.is_admin());

drop policy if exists "admin subcategories all" on public.subcategories;
create policy "admin subcategories all" on public.subcategories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read active tags" on public.sustainability_tags;
create policy "public read active tags" on public.sustainability_tags for select using (active = true or public.is_admin());

drop policy if exists "admin tags all" on public.sustainability_tags;
create policy "admin tags all" on public.sustainability_tags for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read approved products" on public.products;
create policy "public read approved products" on public.products for select
using (approved = true or vendor_id = public.current_vendor_id() or public.is_admin());

drop policy if exists "vendor creates own products" on public.products;
create policy "vendor creates own products" on public.products for insert
with check (vendor_id = public.current_vendor_id() or public.is_admin());

drop policy if exists "vendor updates own products" on public.products;
create policy "vendor updates own products" on public.products for update
using (vendor_id = public.current_vendor_id() or public.is_admin())
with check (vendor_id = public.current_vendor_id() or public.is_admin());

drop policy if exists "admin products delete" on public.products;
create policy "admin products delete" on public.products for delete using (public.is_admin());

drop policy if exists "read product images with product" on public.product_images;
create policy "read product images with product" on public.product_images for select
using (exists (select 1 from public.products p where p.id = product_id and (p.approved = true or p.vendor_id = public.current_vendor_id() or public.is_admin())));

drop policy if exists "write own product images" on public.product_images;
create policy "write own product images" on public.product_images for all
using (exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin())))
with check (exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin())));

drop policy if exists "read product tags with product" on public.product_sustainability_tags;
create policy "read product tags with product" on public.product_sustainability_tags for select
using (exists (select 1 from public.products p where p.id = product_id and (p.approved = true or p.vendor_id = public.current_vendor_id() or public.is_admin())));

drop policy if exists "write own product tags" on public.product_sustainability_tags;
create policy "write own product tags" on public.product_sustainability_tags for all
using (exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin())))
with check (exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin())));

drop policy if exists "rfq participant read" on public.rfqs;
create policy "rfq participant read" on public.rfqs for select
using (buyer_id = public.current_buyer_id() or vendor_id = public.current_vendor_id() or public.is_admin());

drop policy if exists "buyer creates own rfq" on public.rfqs;
create policy "buyer creates own rfq" on public.rfqs for insert
with check (buyer_id = public.current_buyer_id() or public.is_admin());

drop policy if exists "rfq participant update" on public.rfqs;
create policy "rfq participant update" on public.rfqs for update
using (buyer_id = public.current_buyer_id() or vendor_id = public.current_vendor_id() or public.is_admin())
with check (buyer_id = public.current_buyer_id() or vendor_id = public.current_vendor_id() or public.is_admin());

drop policy if exists "public read published blogs" on public.blogs;
create policy "public read published blogs" on public.blogs for select using (published = true or public.is_admin());

drop policy if exists "admin blogs all" on public.blogs;
create policy "admin blogs all" on public.blogs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read active careers" on public.careers;
create policy "public read active careers" on public.careers for select using (active = true or public.is_admin());

drop policy if exists "admin careers all" on public.careers;
create policy "admin careers all" on public.careers for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public create job applications" on public.job_applications;
create policy "public create job applications" on public.job_applications for insert with check (true);

drop policy if exists "admin job applications all" on public.job_applications;
create policy "admin job applications all" on public.job_applications for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select using (true);

drop policy if exists "admin site settings all" on public.site_settings;
create policy "admin site settings all" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read active certifications" on public.certifications;
create policy "public read active certifications" on public.certifications for select using (status = 'Active' or public.is_admin());

drop policy if exists "admin certifications all" on public.certifications;
create policy "admin certifications all" on public.certifications for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read active certifying bodies" on public.certifying_bodies;
create policy "public read active certifying bodies" on public.certifying_bodies for select using (status = 'Active' or public.is_admin());

drop policy if exists "admin certifying bodies all" on public.certifying_bodies;
create policy "admin certifying bodies all" on public.certifying_bodies for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "certification request participant read" on public.certification_requests;
create policy "certification request participant read" on public.certification_requests for select
using (vendor_id = public.current_vendor_id() or public.is_admin());

drop policy if exists "vendor creates certification request" on public.certification_requests;
create policy "vendor creates certification request" on public.certification_requests for insert
with check (vendor_id = public.current_vendor_id() or public.is_admin());

drop policy if exists "admin certification requests all" on public.certification_requests;
create policy "admin certification requests all" on public.certification_requests for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets and baseline policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('marketplace', 'marketplace', true),
  ('vendor-private', 'vendor-private', false),
  ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "public read marketplace files" on storage.objects;
create policy "public read marketplace files" on storage.objects for select
using (bucket_id = 'marketplace');

drop policy if exists "authenticated upload marketplace files" on storage.objects;
create policy "authenticated upload marketplace files" on storage.objects for insert
with check (bucket_id = 'marketplace' and auth.role() = 'authenticated');

drop policy if exists "vendor private own folder read" on storage.objects;
create policy "vendor private own folder read" on storage.objects for select
using (
  bucket_id = 'vendor-private'
  and (
    public.is_admin()
    or name like ('vendors/' || auth.uid()::text || '/%')
  )
);

drop policy if exists "vendor private own folder write" on storage.objects;
create policy "vendor private own folder write" on storage.objects for insert
with check (
  bucket_id = 'vendor-private'
  and (
    public.is_admin()
    or name like ('vendors/' || auth.uid()::text || '/%')
  )
);

drop policy if exists "admin read resumes" on storage.objects;
create policy "admin read resumes" on storage.objects for select
using (bucket_id = 'resumes' and public.is_admin());

drop policy if exists "public upload resumes" on storage.objects;
create policy "public upload resumes" on storage.objects for insert
with check (bucket_id = 'resumes');
