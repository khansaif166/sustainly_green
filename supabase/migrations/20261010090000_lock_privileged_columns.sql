-- Purpose: stop signed-in users from granting themselves privileges.
--
-- The "self insert" / "self update" RLS policies on profiles, vendors, buyers
-- and products check only row ownership, not which columns change. With the
-- public anon key and their own JWT, any user could PATCH their own row and
-- set role = 'ADMIN', vendor_approved = true, approved = true,
-- eco_verified = true, featured = true, and so on.
--
-- The app itself never needs that: every legitimate write to these columns
-- goes through an API route using the service role key (lib/supabaseServer.ts),
-- and the only browser-side write is the first-login profile insert in
-- ensureCurrentProfile() (lib/supabaseAuth.ts). So these triggers lock the
-- admin-controlled columns for end-user requests and leave service-role,
-- admin and direct SQL access untouched.

-- True for anything that is not an ordinary end-user write: the service role
-- key, direct SQL / migrations (no JWT at all), a signed-in ADMIN, or a write
-- issued by another trigger rather than by the client. The last case covers
-- set_vendor_claim_requested(), which moves vendors.claim_status to
-- CLAIM_REQUESTED inside an anon claim insert. A client's own statement always
-- fires these guards at depth 1; only trigger-issued writes nest deeper.
create or replace function public.is_privileged_request()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role(), '') not in ('authenticated', 'anon')
      or pg_trigger_depth() > 1
      or public.is_admin()
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role not in ('BUYER', 'VENDOR') then
      raise exception 'Not allowed to create a profile with role %', new.role
        using errcode = '42501';
    end if;

    -- Mirrors ensureCurrentProfile(): buyers are auto-approved, vendors wait
    -- for an admin. Everything else starts from its safe default regardless
    -- of what the client sent.
    new.buyer_approved := new.role = 'BUYER';
    new.vendor_approved := false;
    new.buyer_profile_complete := false;
    new.vendor_profile_complete := false;
    new.disabled := false;
    new.legacy_firebase_uid := null;
    new.email_verified := coalesce(
      (select u.email_confirmed_at is not null
         from auth.users u
        where u.id = new.auth_user_id),
      false
    );
    return new;
  end if;

  -- UPDATE: name / company_name stay editable; the rest is admin-only.
  if new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.email_verified is distinct from old.email_verified
     or new.buyer_profile_complete is distinct from old.buyer_profile_complete
     or new.buyer_approved is distinct from old.buyer_approved
     or new.vendor_profile_complete is distinct from old.vendor_profile_complete
     or new.vendor_approved is distinct from old.vendor_approved
     or new.disabled is distinct from old.disabled
     or new.auth_user_id is distinct from old.auth_user_id
     or new.legacy_firebase_uid is distinct from old.legacy_firebase_uid
  then
    raise exception 'Not allowed to change protected profile fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileged_columns on public.profiles;
create trigger guard_profile_privileged_columns
before insert or update on public.profiles
for each row execute function public.guard_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------

create or replace function public.guard_vendor_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approved := false;
    new.status := 'submitted';
    new.approved_at := null;
    new.listing_verified := false;
    new.listing_tier := null;
    new.eco_score := '{}'::jsonb;
    -- public_contact carries the admin-assigned badge (sustainlyBadgeType).
    new.public_contact := '{}'::jsonb;
    new.claim_status := 'UNCLAIMED';
    new.claimed_by_profile_id := null;
    new.claimed_at := null;
    new.source := 'SELF_ONBOARDED';
    new.import_batch_id := null;
    return new;
  end if;

  if new.approved is distinct from old.approved
     or new.status is distinct from old.status
     or new.approved_at is distinct from old.approved_at
     or new.listing_verified is distinct from old.listing_verified
     or new.listing_tier is distinct from old.listing_tier
     or new.eco_score is distinct from old.eco_score
     or new.public_contact is distinct from old.public_contact
     or new.claim_status is distinct from old.claim_status
     or new.claimed_by_profile_id is distinct from old.claimed_by_profile_id
     or new.claimed_at is distinct from old.claimed_at
     or new.source is distinct from old.source
     or new.import_batch_id is distinct from old.import_batch_id
     or new.profile_id is distinct from old.profile_id
  then
    raise exception 'Not allowed to change protected vendor fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_vendor_privileged_columns on public.vendors;
create trigger guard_vendor_privileged_columns
before insert or update on public.vendors
for each row execute function public.guard_vendor_privileged_columns();

-- ---------------------------------------------------------------------------
-- buyers
-- ---------------------------------------------------------------------------

create or replace function public.guard_buyer_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approved := false;
    new.status := 'submitted';
    new.approved_at := null;
    return new;
  end if;

  if new.approved is distinct from old.approved
     or new.status is distinct from old.status
     or new.approved_at is distinct from old.approved_at
     or new.profile_id is distinct from old.profile_id
  then
    raise exception 'Not allowed to change protected buyer fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_buyer_privileged_columns on public.buyers;
create trigger guard_buyer_privileged_columns
before insert or update on public.buyers
for each row execute function public.guard_buyer_privileged_columns();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create or replace function public.guard_product_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approved := false;
    new.status := 'PENDING';
    new.featured := false;
    new.eco_verified := false;
    new.is_ad := false;
    new.ad_status := null;
    new.ad_active := false;
    new.ad_placement := null;
    new.ad_position := null;
    new.budget := null;
    new.ad_started_at := null;
    new.ad_ends_at := null;
    new.impressions := 0;
    new.clicks := 0;
    new.views := 0;
    new.last_viewed_at := null;
    return new;
  end if;

  if new.approved is distinct from old.approved
     or new.status is distinct from old.status
     or new.featured is distinct from old.featured
     or new.eco_verified is distinct from old.eco_verified
     or new.is_ad is distinct from old.is_ad
     or new.ad_status is distinct from old.ad_status
     or new.ad_active is distinct from old.ad_active
     or new.ad_placement is distinct from old.ad_placement
     or new.ad_position is distinct from old.ad_position
     or new.budget is distinct from old.budget
     or new.ad_started_at is distinct from old.ad_started_at
     or new.ad_ends_at is distinct from old.ad_ends_at
     or new.impressions is distinct from old.impressions
     or new.clicks is distinct from old.clicks
     or new.views is distinct from old.views
     or new.last_viewed_at is distinct from old.last_viewed_at
     or new.vendor_id is distinct from old.vendor_id
  then
    raise exception 'Not allowed to change protected product fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_product_privileged_columns on public.products;
create trigger guard_product_privileged_columns
before insert or update on public.products
for each row execute function public.guard_product_privileged_columns();
