-- Third level of the product catalog. Existing products keep a NULL type.
create table public.product_types (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid not null references public.subcategories(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 120),
  active boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index product_types_subcategory_name_unique_idx
  on public.product_types (subcategory_id, lower(btrim(name)));
create index product_types_subcategory_active_idx
  on public.product_types (subcategory_id, active, sort_order);
create trigger set_product_types_updated_at before update on public.product_types
  for each row execute function public.set_updated_at();

alter table public.product_types enable row level security;
grant select on public.product_types to anon, authenticated;
grant insert, update, delete on public.product_types to authenticated;
grant all on public.product_types to service_role;
alter table public.products add column product_type_id uuid
  references public.product_types(id) on delete restrict;
create index products_approved_product_type_created_idx
  on public.products (approved, product_type_id, created_at desc);

create policy "public read active or assigned product types" on public.product_types for select
  using (active = true or public.is_admin() or exists (
    select 1 from public.products p where p.product_type_id = id and p.approved = true
  ));
create policy "admin product types all" on public.product_types for all
  using (public.is_admin()) with check (public.is_admin());

-- The selected type must match both parents. An unchanged inactive type can be
-- retained while editing unrelated fields; new assignments must be active.
create function public.validate_product_type_assignment()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare parent_category uuid; type_active boolean;
begin
  if new.subcategory_id is not null then
    perform 1 from public.subcategories where id = new.subcategory_id for share;
  end if;
  if new.product_type_id is null then return new; end if;
  if new.listing_type is distinct from 'Product' or new.category_id is null or new.subcategory_id is null then
    raise exception 'Product type requires a Product listing, category and subcategory.' using errcode = '23514';
  end if;
  select s.category_id, pt.active into parent_category, type_active
    from public.product_types pt join public.subcategories s on s.id = pt.subcategory_id
    where pt.id = new.product_type_id and s.id = new.subcategory_id for share of pt, s;
  if not found or parent_category is distinct from new.category_id then
    raise exception 'Product type does not belong to the selected category and subcategory.' using errcode = '23514';
  end if;
  if not type_active then
    if tg_op = 'INSERT' then
      raise exception 'Product type is inactive.' using errcode = '23514';
    elsif new.product_type_id is distinct from old.product_type_id then
      raise exception 'Product type is inactive.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger validate_product_type_assignment before insert or update of
  product_type_id, category_id, subcategory_id, listing_type on public.products
  for each row execute function public.validate_product_type_assignment();

-- Moving a used type or subcategory would make saved product paths inconsistent.
create function public.prevent_used_catalog_reparent()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'product_types' then
    if new.subcategory_id is distinct from old.subcategory_id and
       exists (select 1 from public.products where product_type_id = old.id) then
      raise exception 'Move products to another type before changing this parent.' using errcode = '23514';
    end if;
  elsif new.category_id is distinct from old.category_id and
        exists (select 1 from public.products where subcategory_id = old.id) then
    raise exception 'Move products to another subcategory before changing this parent.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger prevent_used_type_reparent before update of subcategory_id on public.product_types
  for each row execute function public.prevent_used_catalog_reparent();
create trigger prevent_used_subcategory_reparent before update of category_id on public.subcategories
  for each row execute function public.prevent_used_catalog_reparent();

-- Keep the receipt-aware import transaction in sync with the new column.
create or replace function public.commit_product_import_row(
  p_batch_id uuid, p_row_id uuid, p_attempt_id uuid, p_actor_profile_id uuid, p_storage_base_url text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  batch public.product_import_batches;
  receipt public.product_import_rows;
  actor public.profiles;
  payload jsonb;
  paths text[];
  image jsonb;
  object storage.objects;
  image_index integer := 0;
  new_product uuid;
  vendor_name text;
  tag_ids uuid[];
begin
  select * into batch from public.product_import_batches where id = p_batch_id for update;
  if not found or batch.actor_profile_id <> p_actor_profile_id then
    raise exception 'Import access denied.' using errcode = '42501';
  end if;
  actor := public.assert_product_import_access(p_actor_profile_id, batch.vendor_id);
  select * into receipt from public.product_import_rows where batch_id = p_batch_id and row_id = p_row_id for update;
  if not found or receipt.attempt_id <> p_attempt_id or receipt.state = 'aborted' then
    raise exception 'This upload attempt is no longer active.' using errcode = '23505';
  end if;
  if receipt.state = 'created' then
    if receipt.product_id is null then raise exception 'The imported product was deleted.' using errcode = '23505'; end if;
    return jsonb_build_object('productId', receipt.product_id, 'state', 'created');
  end if;
  payload := receipt.payload;
  perform 1 from public.categories where id = (payload->>'categoryId')::uuid and active = true for share;
  if not found then raise exception 'Category is no longer active.' using errcode = '22023'; end if;
  if payload->>'subCategoryId' is not null then
    perform 1 from public.subcategories where id = (payload->>'subCategoryId')::uuid
      and category_id = (payload->>'categoryId')::uuid and active = true for share;
    if not found then raise exception 'Subcategory is no longer active or does not belong to this category.' using errcode = '22023'; end if;
  end if;
  if payload->>'productTypeId' is not null then
    if payload->>'listingType' <> 'Product' or payload->>'subCategoryId' is null then
      raise exception 'Product type requires a Product listing and subcategory.' using errcode = '22023';
    end if;
    perform 1 from public.product_types pt join public.subcategories s on s.id = pt.subcategory_id
      where pt.id = (payload->>'productTypeId')::uuid
        and pt.subcategory_id = (payload->>'subCategoryId')::uuid
        and s.category_id = (payload->>'categoryId')::uuid and pt.active = true for share of pt, s;
    if not found then raise exception 'Product type is inactive or does not belong to this subcategory.' using errcode = '22023'; end if;
  end if;
  select coalesce(array_agg(value::uuid), '{}'::uuid[]) into tag_ids from jsonb_array_elements_text(payload->'sustainabilityTagIds');
  perform 1 from public.sustainability_tags where id = any(tag_ids) and active = true for share;
  if (select count(*) from public.sustainability_tags where id = any(tag_ids) and active = true) <> cardinality(tag_ids) then
    raise exception 'A sustainability tag is no longer active.' using errcode = '22023';
  end if;
  paths := public.product_import_image_paths(p_actor_profile_id, p_batch_id, p_row_id, p_attempt_id, receipt.images);
  for image in select value from jsonb_array_elements(receipt.images) loop
    image_index := image_index + 1;
    select * into object from storage.objects where bucket_id = 'marketplace' and name = paths[image_index] for share;
    -- Supabase records the uploading JWT subject in objects.owner_id.
    -- https://supabase.com/docs/guides/storage/security/ownership
    if not found or object.owner_id is distinct from actor.auth_user_id::text or
       (object.metadata->>'size')::bigint is distinct from (image->>'size')::bigint or
       object.metadata->>'mimetype' is distinct from image->>'type' then
      raise exception 'A photo is missing, invalid, or belongs to a different user.' using errcode = '22023';
    end if;
  end loop;
  select company_name into vendor_name from public.vendors where id = batch.vendor_id;
  insert into public.products(vendor_id, vendor_name, title, description, listing_type, category_id, subcategory_id, product_type_id,
    available_for, price_type, price, currency, moq, discount, ship_regions, in_stock, sustainability_claim, approved, status)
  values(batch.vendor_id, coalesce(vendor_name, 'Unknown Vendor'), payload->>'title', nullif(payload->>'description',''),
    payload->>'listingType', (payload->>'categoryId')::uuid, (payload->>'subCategoryId')::uuid, (payload->>'productTypeId')::uuid,
    array(select jsonb_array_elements_text(payload->'availableFor')), payload->>'priceType', (payload->>'price')::numeric,
    payload->>'currency', (payload->>'moq')::numeric, nullif(payload->>'discount',''),
    array(select jsonb_array_elements_text(payload->'shipRegions')), (payload->>'inStock')::boolean,
    nullif(payload->>'sustainabilityClaim',''), actor.role::text = 'ADMIN',
    case when actor.role::text = 'ADMIN' then 'APPROVED'::public.product_status else 'PENDING'::public.product_status end)
  returning id into new_product;
  insert into public.product_images(product_id, url, storage_path, sort_order)
    select new_product, rtrim(p_storage_base_url,'/') || '/storage/v1/object/public/marketplace/' || path, path, ordinality - 1
    from unnest(paths) with ordinality as image_paths(path, ordinality);
  insert into public.product_sustainability_tags(product_id, tag_id, tag_name_snapshot)
    select new_product, id, name from public.sustainability_tags where id = any(tag_ids);
  update public.product_import_rows set state = 'created', product_id = new_product, updated_at = now()
    where batch_id = p_batch_id and row_id = p_row_id;
  return jsonb_build_object('state','created','productId',new_product);
end;
$$;
