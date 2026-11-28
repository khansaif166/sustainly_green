-- Atomically replace cover images without deleting the current image first.
create or replace function public.write_vendor_rich_profile(
  p_vendor_id uuid, p_actor_profile_id uuid, p_action text, p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  vendor public.vendors%rowtype;
  profile public.vendor_rich_profiles%rowtype;
  ad public.vendor_rich_ads%rowtype;
  media public.vendor_rich_media%rowtype;
  is_admin boolean;
  item_id uuid := nullif(p_data->>'id', '')::uuid;
  item_kind text;
  item_key text;
  old_path text;
  item_limit integer;
begin
  select * into actor from public.profiles where id = p_actor_profile_id;
  is_admin := actor.role = 'ADMIN';
  if actor.id is null or actor.disabled or actor.role not in ('ADMIN', 'VENDOR') then
    raise exception 'You do not have access to this profile.' using errcode = '42501';
  end if;

  -- A vendor row exists even before activation. Lock it to serialize limits,
  -- profile changes, moderation, and edits made from different sessions.
  select * into vendor from public.vendors where id = p_vendor_id for update;
  if not found or (not is_admin and vendor.profile_id is distinct from actor.id) then
    raise exception 'Vendor not found.' using errcode = 'P0002';
  end if;

  insert into public.vendor_rich_profiles(vendor_id) values (p_vendor_id)
  on conflict (vendor_id) do nothing;
  select * into profile from public.vendor_rich_profiles where vendor_id = p_vendor_id;

  if p_action in ('activate', 'moderate') and not is_admin then
    raise exception 'Only an admin can perform this action.' using errcode = '42501';
  end if;
  if not is_admin and (not vendor.approved or not actor.vendor_approved or not profile.active) then
    raise exception 'Rich Profile is read-only until an admin activates it for an approved vendor.' using errcode = '42501';
  end if;

  case p_action
    when 'activate' then
      update public.vendor_rich_profiles set active = (p_data->>'active')::boolean where vendor_id = p_vendor_id;
    when 'content' then
      if profile.revision is distinct from (p_data->>'revision')::integer then
        raise exception 'This profile was updated in another session. Reload before saving.' using errcode = '40001';
      end if;
      update public.vendor_rich_profiles
      set content = case when is_admin then p_data->'content'
        else ((p_data->'content') - 'claimStatus'::text) ||
          case when profile.content ? 'claimStatus' then jsonb_build_object('claimStatus', profile.content->'claimStatus')
            else '{}'::jsonb end end,
        revision = revision + 1
      where vendor_id = p_vendor_id;
    when 'replace_cover' then
      -- The vendor lock above serializes replacement with deletion and limits.
      -- Update the existing row so a failed transaction never removes the cover.
      select * into media from public.vendor_rich_media
        where vendor_id = p_vendor_id and id = item_id and purpose = 'cover';
      if not found then
        raise exception 'Cover image changed or was removed. Reload before replacing it.' using errcode = 'P0002';
      end if;
      if nullif(btrim(p_data->>'title'), '') is null
          or length(p_data->>'title') > 120
          or nullif(p_data->>'storagePath', '') is null
          or p_data->>'storagePath' not like p_vendor_id::text || '/%'
          or p_data->>'mimeType' is null
          or p_data->>'mimeType' not in ('image/jpeg', 'image/png', 'image/webp')
          or nullif(p_data->>'sourceUrl', '') is not null then
        raise exception 'A valid replacement cover image is required.' using errcode = '23514';
      end if;
      old_path := media.storage_path;
      update public.vendor_rich_media set
        title = btrim(p_data->>'title'), storage_path = p_data->>'storagePath',
        mime_type = p_data->>'mimeType', source_url = null
      where id = item_id and vendor_id = p_vendor_id;
    when 'add_media' then
      item_kind := p_data->>'purpose';
      item_limit := case item_kind when 'gallery' then 20 when 'partner' then 5 when 'video' then 3
        when 'credential' then 20 when 'award' then 20 else 1 end;
      if (select count(*) from public.vendor_rich_media where vendor_id = p_vendor_id and purpose = item_kind) >= item_limit then
        raise exception 'This section has reached its media limit.' using errcode = '23514';
      end if;
      if item_kind in ('intro', 'video') and (select count(*) from public.vendor_rich_media
          where vendor_id = p_vendor_id and purpose in ('intro', 'video')) >= 3 then
        raise exception 'This vendor has reached the profile video limit.' using errcode = '23514';
      end if;
      insert into public.vendor_rich_media(vendor_id, purpose, title, source_url, storage_path, mime_type, sort_order)
      values (p_vendor_id, item_kind, p_data->>'title', p_data->>'sourceUrl', p_data->>'storagePath', p_data->>'mimeType',
        coalesce((select max(sort_order) + 1 from public.vendor_rich_media where vendor_id = p_vendor_id and purpose = item_kind), 0))
      returning id into item_id;
    when 'delete_media' then
      delete from public.vendor_rich_media where vendor_id = p_vendor_id and id = item_id returning storage_path into old_path;
      if not found then raise exception 'Media item not found.' using errcode = 'P0002'; end if;
    when 'save_ad', 'delete_ad', 'moderate' then
      if item_id is not null then
        select * into ad from public.vendor_rich_ads where vendor_id = p_vendor_id and id = item_id;
        if not found or (ad.deleted_at is not null and p_action <> 'moderate') then
          raise exception 'Ad not found.' using errcode = 'P0002';
        end if;
      elsif p_action <> 'save_ad' then
        raise exception 'Ad not found.' using errcode = 'P0002';
      end if;

      if p_action = 'delete_ad' then
        update public.vendor_rich_ads set deleted_at = now() where id = item_id;
        old_path := ad.storage_path;
      elsif p_action = 'moderate' then
        update public.vendor_rich_ads set admin_enabled = (p_data->>'enabled')::boolean where id = item_id;
        if (p_data->>'enabled')::boolean then
          delete from public.vendor_rich_blocked_creatives where ad_id = item_id;
        else
          insert into public.vendor_rich_blocked_creatives(ad_id, vendor_id, kind, source_key)
          values (item_id, p_vendor_id, ad.kind, ad.source_key) on conflict do nothing;
        end if;
      else
        item_kind := coalesce(ad.kind, p_data->>'kind');
        item_key := coalesce(p_data->>'sourceKey', ad.source_key);
        if item_key is null then
          raise exception 'An ad creative is required.' using errcode = '23514';
        end if;
        if item_key is distinct from ad.source_key and exists (
          select 1 from public.vendor_rich_blocked_creatives
          where vendor_id = p_vendor_id and kind = item_kind and source_key = item_key
            and ad_id is distinct from item_id
        ) then
          raise exception 'An admin has blocked this creative.' using errcode = '23514';
        end if;
        if item_id is null then
          item_limit := case item_kind when 'banner' then 5 else 3 end;
          if (select count(*) from public.vendor_rich_ads where vendor_id = p_vendor_id and kind = item_kind and deleted_at is null) >= item_limit then
            raise exception 'This vendor has reached the limit for this ad type.' using errcode = '23514';
          end if;
          insert into public.vendor_rich_ads(vendor_id, kind, title, source_url, storage_path, mime_type,
            source_key, link_url, sort_order, vendor_enabled)
          values (p_vendor_id, item_kind, p_data->>'title', p_data->>'sourceUrl', p_data->>'storagePath', p_data->>'mimeType',
            item_key, p_data->>'linkUrl', (p_data->>'sortOrder')::integer, (p_data->>'enabled')::boolean)
          returning id into item_id;
        else
          update public.vendor_rich_ads set
            title = p_data->>'title',
            source_url = case when p_data ? 'sourceKey' then p_data->>'sourceUrl' else ad.source_url end,
            storage_path = case when p_data ? 'sourceKey' then p_data->>'storagePath' else ad.storage_path end,
            mime_type = case when p_data ? 'sourceKey' then p_data->>'mimeType' else ad.mime_type end,
            source_key = item_key, link_url = p_data->>'linkUrl', sort_order = (p_data->>'sortOrder')::integer,
            vendor_enabled = (p_data->>'enabled')::boolean
          where id = item_id;
          if p_data ? 'sourceKey' then old_path := ad.storage_path; end if;
          if not ad.admin_enabled then
            insert into public.vendor_rich_blocked_creatives(ad_id, vendor_id, kind, source_key)
            values (item_id, p_vendor_id, item_kind, item_key) on conflict do nothing;
          end if;
        end if;
      end if;
    else
      raise exception 'Unsupported Rich Profile action.' using errcode = '22023';
  end case;

  return jsonb_build_object('id', item_id, 'oldPath', old_path);
end;
$$;

revoke all on function public.write_vendor_rich_profile(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.write_vendor_rich_profile(uuid, uuid, text, jsonb) to service_role;
