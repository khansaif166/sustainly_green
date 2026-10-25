-- Readable vendor URLs: /find-vendors/ea-water-private-limited instead of
-- /find-vendors/<uuid>. The uuid form keeps working and redirects (see
-- app/find-vendors/[vendorId]/page.tsx).
--
-- * Every vendor gets a unique slug built from its company name; a clash
--   adds the state, then -2, -3 …
-- * New vendors (Excel import, self-onboarding) get one automatically.
-- * The slug never changes on its own — renaming a company keeps the old
--   URL working. Only admins / the service role can set a different one, so
--   a vendor can't take over another business's URL.

alter table public.vendors add column if not exists slug text;

-- Lower-case words joined by hyphens: accents folded (café -> cafe), cut at
-- a word boundary to at most 80 characters.
create or replace function public.vendor_slugify(value text)
returns text
language sql
immutable
as $$
  with dashed as (
    select trim(both '-' from regexp_replace(
      translate(lower(coalesce(value, '')),
        'áàâäãåāéèêëēíìîïīóòôöõøōúùûüūçñýÿ',
        'aaaaaaaeeeeeiiiiiooooooouuuuucnyy'),
      '[^a-z0-9]+', '-', 'g')) as slug
  )
  select nullif(
    case
      when length(slug) <= 80 then slug
      else coalesce(nullif(regexp_replace(left(slug, 81), '-[^-]*$', ''), ''), left(slug, 80))
    end,
    ''
  )
  from dashed
$$;

create or replace function public.next_vendor_slug(company text, state text, vendor_id uuid)
returns text
language plpgsql
-- volatile (the default) so rows inserted earlier in the same multi-row
-- INSERT, e.g. one Excel import, are visible and get distinct slugs.
volatile
set search_path = public
as $$
declare
  base text := coalesce(public.vendor_slugify(company), 'vendor');
  candidate text := base;
  state_part text := public.vendor_slugify(state);
  n integer := 2;
begin
  if not exists (select 1 from public.vendors v where v.slug = candidate and v.id is distinct from vendor_id) then
    return candidate;
  end if;

  if state_part is not null then
    candidate := base || '-' || state_part;
    if not exists (select 1 from public.vendors v where v.slug = candidate and v.id is distinct from vendor_id) then
      return candidate;
    end if;
    base := candidate;
  end if;

  loop
    candidate := base || '-' || n;
    exit when not exists (select 1 from public.vendors v where v.slug = candidate and v.id is distinct from vendor_id);
    n := n + 1;
  end loop;
  return candidate;
end;
$$;

create or replace function public.set_vendor_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and not public.is_privileged_request() then
    new.slug := old.slug;
  end if;

  if new.slug is not null then
    new.slug := public.vendor_slugify(new.slug);
  end if;

  if new.slug is null then
    new.slug := public.next_vendor_slug(new.company_name, new.state, new.id);
  end if;

  return new;
end;
$$;

-- Fill existing vendors, oldest first, so the original listing keeps the
-- plain name when two share it.
do $$
declare
  r record;
begin
  for r in select id, company_name, state from public.vendors where slug is null order by created_at, id loop
    update public.vendors
       set slug = public.next_vendor_slug(r.company_name, r.state, r.id)
     where id = r.id;
  end loop;
end;
$$;

create unique index if not exists vendors_slug_key on public.vendors (slug);

drop trigger if exists set_vendor_slug on public.vendors;
create trigger set_vendor_slug
before insert or update on public.vendors
for each row execute function public.set_vendor_slug();

alter table public.vendors alter column slug set not null;
