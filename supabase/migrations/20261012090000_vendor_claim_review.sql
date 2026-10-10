-- Purpose: let admins approve or reject "Claim this business" requests.
--
-- Until now nothing read vendor_claims, so a claim could only ever sit at
-- PENDING. Approving has to change three tables together (vendor ownership,
-- the claimant's role, the claim itself), so each action is one function and
-- either fully happens or not at all. Only the service role (the admin API
-- routes) may call them.

create or replace function public.approve_vendor_claim(
  p_claim_id uuid,
  p_reviewer_profile_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claim public.vendor_claims%rowtype;
  listing public.vendors%rowtype;
  claimant public.profiles%rowtype;
begin
  select * into claim from public.vendor_claims where id = p_claim_id for update;
  if not found then
    raise exception 'Claim not found.';
  end if;
  if claim.status <> 'PENDING' then
    raise exception 'This claim has already been %.', lower(claim.status::text);
  end if;
  if claim.profile_id is null then
    raise exception 'This claim is not linked to an account, so ownership cannot be transferred. Reject it and ask the requester to sign in and claim again.';
  end if;

  select * into listing from public.vendors where id = claim.vendor_id for update;
  if listing.profile_id is not null and listing.profile_id <> claim.profile_id then
    raise exception 'This listing is already owned by another account.';
  end if;
  -- vendors.profile_id is unique: one vendor profile per account.
  if exists (
    select 1 from public.vendors
     where profile_id = claim.profile_id and id <> listing.id
  ) then
    raise exception 'The requester already owns a different vendor profile. Merge or remove that profile before approving this claim.';
  end if;

  select * into claimant from public.profiles where id = claim.profile_id for update;
  if not found or claimant.disabled then
    raise exception 'The requester''s account no longer exists or is disabled.';
  end if;
  if claimant.role = 'ADMIN' then
    raise exception 'Admin accounts cannot own a vendor listing.';
  end if;

  update public.vendors
     set profile_id = claim.profile_id,
         claim_status = 'CLAIMED',
         claimed_by_profile_id = claim.profile_id,
         claimed_at = now(),
         updated_at = now()
   where id = listing.id;

  -- The listing is already live and the admin has just verified ownership,
  -- so the account is an approved vendor. vendor_profile_complete is left as
  -- it was: a former buyer lands in vendor onboarding, pre-filled from the
  -- claimed listing, to review and complete it.
  update public.profiles
     set role = 'VENDOR',
         vendor_approved = true,
         company_name = coalesce(company_name, listing.company_name),
         updated_at = now()
   where id = claimant.id;

  update public.vendor_claims
     set status = 'APPROVED',
         reviewed_by_profile_id = p_reviewer_profile_id,
         reviewed_at = now(),
         review_notes = p_notes
   where id = claim.id;

  update public.vendor_claims
     set status = 'REJECTED',
         reviewed_by_profile_id = p_reviewer_profile_id,
         reviewed_at = now(),
         review_notes = 'Another claim for this business was approved.'
   where vendor_id = listing.id
     and status = 'PENDING'
     and id <> claim.id;
end;
$$;

create or replace function public.reject_vendor_claim(
  p_claim_id uuid,
  p_reviewer_profile_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claim public.vendor_claims%rowtype;
begin
  select * into claim from public.vendor_claims where id = p_claim_id for update;
  if not found then
    raise exception 'Claim not found.';
  end if;
  if claim.status <> 'PENDING' then
    raise exception 'This claim has already been %.', lower(claim.status::text);
  end if;

  update public.vendor_claims
     set status = 'REJECTED',
         reviewed_by_profile_id = p_reviewer_profile_id,
         reviewed_at = now(),
         review_notes = p_notes
   where id = claim.id;

  -- With no other request waiting, reopen the listing so its owner can claim it.
  if not exists (
    select 1 from public.vendor_claims
     where vendor_id = claim.vendor_id and status = 'PENDING'
  ) then
    update public.vendors
       set claim_status = 'UNCLAIMED',
           updated_at = now()
     where id = claim.vendor_id
       and claim_status = 'CLAIM_REQUESTED';
  end if;
end;
$$;

revoke execute on function public.approve_vendor_claim(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.reject_vendor_claim(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.approve_vendor_claim(uuid, uuid, text) to service_role;
grant execute on function public.reject_vendor_claim(uuid, uuid, text) to service_role;
