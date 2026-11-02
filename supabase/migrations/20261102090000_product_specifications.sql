-- Optional, ordered custom fields saved atomically with the product row.
create function public.valid_product_specifications(specifications jsonb)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare
  specification jsonb;
  field_name text;
  field_value text;
  seen_names text[] := '{}';
begin
  if jsonb_typeof(specifications) <> 'array' then return false; end if;
  if jsonb_array_length(specifications) > 20 then return false; end if;
  for specification in select value from jsonb_array_elements(specifications) loop
    if jsonb_typeof(specification) <> 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(specification)) <> 2
       or jsonb_typeof(specification -> 'name') is distinct from 'string'
       or jsonb_typeof(specification -> 'value') is distinct from 'string' then return false; end if;
    field_name := regexp_replace(specification ->> 'name', '^\s+|\s+$', '', 'g');
    field_value := regexp_replace(specification ->> 'value', '^\s+|\s+$', '', 'g');
    if char_length(field_name) not between 1 and 80
       or char_length(field_value) not between 1 and 1000
       or lower(field_name) = any(seen_names) then return false; end if;
    seen_names := array_append(seen_names, lower(field_name));
  end loop;
  return true;
end;
$$;

-- Pure validation; callers updating rows need permission to evaluate the CHECK.
revoke all on function public.valid_product_specifications(jsonb) from public;
grant execute on function public.valid_product_specifications(jsonb) to anon, authenticated, service_role;

alter table public.products
  add column specifications jsonb not null default '[]'::jsonb,
  add constraint products_specifications_valid check (public.valid_product_specifications(specifications));

comment on column public.products.specifications is 'Ordered optional [{"name":"Material","value":"Bamboo"}] fields. Product ownership, visibility and approval policies apply.';
notify pgrst, 'reload schema';
