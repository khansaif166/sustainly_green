alter table public.vendor_rich_media
  add column news_record_only boolean not null default false,
  add constraint vendor_rich_media_news_image_check
    check (not news_record_only or (purpose = 'gallery' and storage_path is not null));

-- Preserve attachments on existing updates and hide saved draft images.
update public.vendor_rich_media as media
set news_record_only = true
from public.vendor_rich_profiles as profile
where media.vendor_id = profile.vendor_id
  and media.purpose = 'gallery'
  and media.storage_path is not null
  and exists (
    select 1
    from jsonb_array_elements(profile.content->'news') as update_record
    where update_record.value->>'imageId' = media.id::text
  );

create function public.add_vendor_rich_news_image(
  p_vendor_id uuid, p_actor_profile_id uuid, p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  asset jsonb;
begin
  if nullif(btrim(p_data->>'title'), '') is null or length(p_data->>'title') > 120
      or coalesce(p_data->>'storagePath', '') not like p_vendor_id::text || '/%'
      or coalesce(p_data->>'mimeType', '') not in ('image/jpeg', 'image/png', 'image/webp')
      or nullif(p_data->>'sourceUrl', '') is not null then
    raise exception 'Choose a JPEG, PNG, or WebP news image.' using errcode = '23514';
  end if;

  -- Reuse the gallery limit, authorization and vendor lock. The row first
  -- becomes visible to readers after the private flag is also committed.
  asset := public.write_vendor_rich_profile(
    p_vendor_id, p_actor_profile_id, 'add_media', p_data || '{"purpose":"gallery"}'::jsonb
  );
  update public.vendor_rich_media
  set news_record_only = true
  where vendor_id = p_vendor_id and id = (asset->>'id')::uuid;
  return asset;
end;
$$;

revoke all on function public.add_vendor_rich_news_image(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.add_vendor_rich_news_image(uuid, uuid, jsonb) to service_role;
