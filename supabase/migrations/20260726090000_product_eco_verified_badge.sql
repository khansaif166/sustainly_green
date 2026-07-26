-- Eco Verified belongs to individual products. Verified Supplier remains a
-- vendor-level badge.

alter table public.products
  add column if not exists eco_verified boolean not null default false;

create index if not exists products_eco_verified_approved_idx
  on public.products (eco_verified, approved)
  where eco_verified = true;

-- Preserve any existing vendor-level Eco Verified assignment by applying it
-- to that vendor's current products before removing it from the vendor.
update public.products p
set eco_verified = true,
    updated_at = now()
from public.vendors v
where p.vendor_id = v.id
  and v.listing_verified = true
  and v.public_contact ->> 'sustainlyBadgeType' = 'eco_verified';

update public.vendors
set listing_verified = false,
    public_contact = public_contact - 'sustainlyBadgeType',
    updated_at = now()
where listing_verified = true
  and public_contact ->> 'sustainlyBadgeType' = 'eco_verified';
