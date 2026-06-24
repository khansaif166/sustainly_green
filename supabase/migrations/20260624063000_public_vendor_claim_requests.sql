-- Allow public business-ownership claim requests for imported listings.
-- This does not grant ownership. It only creates a pending review item.

create or replace function public.set_vendor_claim_requested()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'PENDING' then
    update public.vendors
    set claim_status = 'CLAIM_REQUESTED',
        updated_at = now()
    where id = new.vendor_id
      and claim_status = 'UNCLAIMED';
  end if;

  return new;
end;
$$;

create or replace function public.prepare_public_vendor_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user = 'anon' then
    new.profile_id = null;
    new.status = 'PENDING';
    new.reviewed_by_profile_id = null;
    new.reviewed_at = null;
    new.review_notes = null;
    new.proof_documents = coalesce(new.proof_documents, '[]'::jsonb);
    new.raw_payload = coalesce(new.raw_payload, '{}'::jsonb);
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_public_vendor_claim_before_insert on public.vendor_claims;
create trigger prepare_public_vendor_claim_before_insert
before insert on public.vendor_claims
for each row execute function public.prepare_public_vendor_claim();

drop trigger if exists set_vendor_claim_requested_after_insert on public.vendor_claims;
create trigger set_vendor_claim_requested_after_insert
after insert on public.vendor_claims
for each row execute function public.set_vendor_claim_requested();

drop policy if exists "public create unclaimed vendor claims" on public.vendor_claims;
create policy "public create unclaimed vendor claims" on public.vendor_claims
for insert
to anon
with check (true);
