-- Create-only product imports. All RPCs are service-role-only; API routes
-- authenticate the actor and revalidate the spreadsheet before calling them.
create table public.product_import_batches (
  id uuid primary key,
  actor_profile_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.product_import_rows (
  batch_id uuid not null references public.product_import_batches(id) on delete cascade,
  row_id uuid not null,
  row_number integer not null check (row_number between 1 and 100),
  fingerprint text not null,
  payload jsonb not null,
  images jsonb not null default '[]'::jsonb,
  attempt_id uuid not null default gen_random_uuid(),
  state text not null default 'prepared' check (state in ('prepared', 'created', 'aborted')),
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (batch_id, row_id),
  unique (batch_id, row_number)
);

alter table public.product_import_batches enable row level security;
alter table public.product_import_rows enable row level security;
revoke all on public.product_import_batches, public.product_import_rows from public, anon, authenticated;
grant all on public.product_import_batches, public.product_import_rows to service_role;

create function public.assert_product_import_access(p_actor uuid, p_vendor uuid)
returns public.profiles language plpgsql security definer set search_path = public, pg_temp as $$
declare actor public.profiles; owner_profile uuid;
begin
  select * into actor from public.profiles where id = p_actor and disabled = false;
  if not found or actor.role::text not in ('ADMIN', 'VENDOR') or actor.auth_user_id is null then
    raise exception 'Import access denied.' using errcode = '42501';
  end if;
  select profile_id into owner_profile from public.vendors where id = p_vendor;
  if not found then raise exception 'Vendor not found.' using errcode = '22023'; end if;
  if actor.role::text = 'VENDOR' and owner_profile is distinct from actor.id then
    raise exception 'Import access denied.' using errcode = '42501';
  end if;
  return actor;
end;
$$;

create function public.product_import_image_paths(p_actor uuid, p_batch uuid, p_row uuid, p_attempt uuid, p_images jsonb)
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select coalesce(array_agg(
    'products/imports/' || p_actor || '/' || p_batch || '/' || p_row || '/' || p_attempt || '/' ||
    ordinality || '-' || (value->>'sha256') ||
    case when value->>'type' = 'image/webp' then '.webp' else '.png' end
    order by ordinality
  ), '{}'::text[]) from jsonb_array_elements(p_images) with ordinality
$$;

create function public.prepare_product_import_row(
  p_batch_id uuid, p_row_id uuid, p_row_number integer, p_actor_profile_id uuid,
  p_vendor_id uuid, p_payload jsonb, p_images jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  batch public.product_import_batches;
  receipt public.product_import_rows;
  v_fingerprint text := md5(p_payload::text || p_images::text);
  image jsonb;
begin
  perform public.assert_product_import_access(p_actor_profile_id, p_vendor_id);
  if p_row_number is null or p_row_number not between 1 and 100 or
     p_batch_id is null or p_row_id is null or p_payload is null or p_images is null or
     jsonb_typeof(p_payload) <> 'object' or jsonb_typeof(p_images) <> 'array' then
    raise exception 'Invalid import row.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_images) > 5 then
    raise exception 'At most five images are allowed.' using errcode = '22023';
  end if;
  for image in select value from jsonb_array_elements(p_images) loop
    if coalesce(image->>'sha256', '') !~ '^[a-f0-9]{64}$' or
       coalesce(image->>'type', '') not in ('image/webp', 'image/png') or
       coalesce((image->>'size')::bigint, 0) not between 1 and 5242880 then
      raise exception 'Invalid image manifest.' using errcode = '22023';
    end if;
  end loop;
  insert into public.product_import_batches(id, actor_profile_id, vendor_id)
  values(p_batch_id, p_actor_profile_id, p_vendor_id) on conflict do nothing;
  -- Serializes the short database operations for this batch. Uploads happen
  -- outside this transaction, so they do not hold database locks.
  select * into batch from public.product_import_batches where id = p_batch_id for update;
  if batch.actor_profile_id <> p_actor_profile_id or batch.vendor_id <> p_vendor_id then
    raise exception 'A batch belongs to one actor and one vendor.' using errcode = '42501';
  end if;
  select * into receipt from public.product_import_rows where batch_id = p_batch_id and row_id = p_row_id for update;
  if found then
    if receipt.row_number <> p_row_number then
      raise exception 'Row identity conflict.' using errcode = '23505';
    end if;
    if receipt.state <> 'aborted' and (receipt.fingerprint <> v_fingerprint or receipt.payload is distinct from p_payload or receipt.images is distinct from p_images) then
      raise exception 'This row was already submitted with different data.' using errcode = '23505';
    end if;
    if receipt.state = 'created' and receipt.product_id is null then
      raise exception 'The imported product was deleted. Start a new batch to recreate it.' using errcode = '23505';
    end if;
    if receipt.state = 'aborted' then
      -- A new attempt gets a new folder, so delayed cleanup of the old attempt
      -- can never delete the replacement upload.
      update public.product_import_rows set state = 'prepared', attempt_id = gen_random_uuid(),
        payload = p_payload, images = p_images, fingerprint = v_fingerprint, updated_at = now()
      where batch_id = p_batch_id and row_id = p_row_id returning * into receipt;
    end if;
  else
    insert into public.product_import_rows(batch_id, row_id, row_number, fingerprint, payload, images)
    values(p_batch_id, p_row_id, p_row_number, v_fingerprint, p_payload, p_images) returning * into receipt;
  end if;
  return jsonb_build_object('state', receipt.state, 'attemptId', receipt.attempt_id,
    'productId', receipt.product_id, 'paths', public.product_import_image_paths(p_actor_profile_id, p_batch_id, p_row_id, receipt.attempt_id, receipt.images));
end;
$$;

create function public.commit_product_import_row(
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
  insert into public.products(vendor_id, vendor_name, title, description, listing_type, category_id, subcategory_id,
    available_for, price_type, price, currency, moq, discount, ship_regions, in_stock, sustainability_claim, approved, status)
  values(batch.vendor_id, coalesce(vendor_name, 'Unknown Vendor'), payload->>'title', nullif(payload->>'description',''),
    payload->>'listingType', (payload->>'categoryId')::uuid, (payload->>'subCategoryId')::uuid,
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

create function public.get_product_import_row(p_batch_id uuid, p_row_id uuid, p_actor_profile_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare batch public.product_import_batches; receipt public.product_import_rows;
begin
  select * into batch from public.product_import_batches where id = p_batch_id for update;
  if not found then return jsonb_build_object('state','missing'); end if;
  if batch.actor_profile_id <> p_actor_profile_id then raise exception 'Import access denied.' using errcode = '42501'; end if;
  perform public.assert_product_import_access(p_actor_profile_id, batch.vendor_id);
  select * into receipt from public.product_import_rows where batch_id = p_batch_id and row_id = p_row_id;
  if not found then return jsonb_build_object('state','missing'); end if;
  if receipt.state = 'created' and receipt.product_id is null then raise exception 'The imported product was deleted.' using errcode = '23505'; end if;
  return jsonb_build_object('state',receipt.state,'productId',receipt.product_id);
end;
$$;

create function public.abort_product_import_row(p_batch_id uuid, p_row_id uuid, p_attempt_id uuid, p_actor_profile_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare batch public.product_import_batches; receipt public.product_import_rows; actor public.profiles; paths text[];
begin
  select * into batch from public.product_import_batches where id = p_batch_id for update;
  if not found or batch.actor_profile_id <> p_actor_profile_id then raise exception 'Import access denied.' using errcode = '42501'; end if;
  actor := public.assert_product_import_access(p_actor_profile_id, batch.vendor_id);
  select * into receipt from public.product_import_rows where batch_id = p_batch_id and row_id = p_row_id for update;
  if not found or receipt.attempt_id <> p_attempt_id then raise exception 'Upload attempt conflict.' using errcode = '23505'; end if;
  if receipt.state = 'created' then return jsonb_build_object('state','created','productId',receipt.product_id,'paths','[]'::jsonb); end if;
  update public.product_import_rows set state = 'aborted', updated_at = now() where batch_id = p_batch_id and row_id = p_row_id;
  paths := public.product_import_image_paths(p_actor_profile_id, p_batch_id, p_row_id, p_attempt_id, receipt.images);
  return jsonb_build_object('state','aborted','paths', coalesce((
    select jsonb_agg(o.name) from storage.objects o where o.bucket_id = 'marketplace'
      and o.name = any(paths) and o.owner_id = actor.auth_user_id::text
      and not exists(select 1 from public.product_images pi where pi.storage_path = o.name)
  ), '[]'::jsonb));
end;
$$;

revoke execute on function public.assert_product_import_access(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.product_import_image_paths(uuid, uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.prepare_product_import_row(uuid, uuid, integer, uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.commit_product_import_row(uuid, uuid, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.abort_product_import_row(uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.assert_product_import_access(uuid, uuid) to service_role;
grant execute on function public.product_import_image_paths(uuid, uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.prepare_product_import_row(uuid, uuid, integer, uuid, uuid, jsonb, jsonb) to service_role;
grant execute on function public.commit_product_import_row(uuid, uuid, uuid, uuid, text) to service_role;
grant execute on function public.abort_product_import_row(uuid, uuid, uuid, uuid) to service_role;

revoke execute on function public.get_product_import_row(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_product_import_row(uuid, uuid, uuid) to service_role;
