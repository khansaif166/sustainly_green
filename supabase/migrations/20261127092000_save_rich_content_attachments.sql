create function public.save_rich_content_attachments(
  p_vendor_id uuid, p_actor_profile_id uuid, p_data jsonb, p_attachments jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attachment record;
  asset jsonb;
  record_group text;
  reference_field text;
  record_data jsonb;
  seen text[] := '{}';
  target_key text;
begin
  if jsonb_typeof(p_attachments) is distinct from 'array' or jsonb_array_length(p_attachments) = 0 then
    raise exception 'Choose a certificate PDF or award image.' using errcode = '23514';
  end if;

  for attachment in select * from jsonb_to_recordset(p_attachments) as input(
    "index" integer, title text, "storagePath" text, "mimeType" text, purpose text
  ) loop
    case attachment.purpose
      when 'award' then
        record_group := 'awards';
        reference_field := 'imageId';
        if coalesce(attachment."mimeType", '') not in ('image/jpeg', 'image/png', 'image/webp') then
          raise exception 'Choose a JPEG, PNG, or WebP award image.' using errcode = '23514';
        end if;
      when 'credential' then
        record_group := 'certificates';
        reference_field := 'documentId';
        if attachment."mimeType" is distinct from 'application/pdf' then
          raise exception 'Choose a certificate PDF.' using errcode = '23514';
        end if;
      else
        raise exception 'Unsupported profile attachment.' using errcode = '23514';
    end case;

    target_key := record_group || ':' || attachment."index";
    record_data := p_data->'content'->record_group->attachment."index";
    if attachment."index" is null or attachment."index" < 0
        or target_key = any(seen)
        or jsonb_typeof(record_data) is distinct from 'object'
        or not (record_data ? reference_field)
        or nullif(btrim(attachment.title), '') is null or length(attachment.title) > 120
        or attachment."storagePath" is null or attachment."storagePath" not like p_vendor_id::text || '/%' then
      raise exception 'Choose one attachment for an existing record.' using errcode = '23514';
    end if;
    seen := array_append(seen, target_key);
    -- The existing write action holds the vendor lock until the transaction ends.
    asset := public.write_vendor_rich_profile(p_vendor_id, p_actor_profile_id, 'add_media',
      jsonb_build_object('purpose', attachment.purpose, 'title', attachment.title,
        'storagePath', attachment."storagePath", 'mimeType', attachment."mimeType"));
    p_data := jsonb_set(p_data, array['content', record_group, attachment."index"::text, reference_field],
      to_jsonb(asset->>'id'), false);
  end loop;

  if exists (
    select 1 from (
      select 'award' as purpose, value->>'imageId' as id
        from jsonb_array_elements(coalesce(p_data->'content'->'awards', '[]'::jsonb))
      union all
      select 'credential', value->>'documentId'
        from jsonb_array_elements(coalesce(p_data->'content'->'certificates', '[]'::jsonb))
    ) as reference
    where nullif(reference.id, '') is not null and not exists (
      select 1 from public.vendor_rich_media as media
      where media.vendor_id = p_vendor_id and media.purpose = reference.purpose and media.id::text = reference.id
    )
  ) then
    raise exception 'An award image or certification PDF was removed. Reload the editor before saving.' using errcode = '23514';
  end if;

  return public.write_vendor_rich_profile(p_vendor_id, p_actor_profile_id, 'content', p_data);
end;
$$;

revoke all on function public.save_rich_content_attachments(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_rich_content_attachments(uuid, uuid, jsonb, jsonb) to service_role;

create or replace function public.save_rich_certificate_pdfs(
  p_vendor_id uuid, p_actor_profile_id uuid, p_data jsonb, p_pdfs jsonb
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.save_rich_content_attachments(p_vendor_id, p_actor_profile_id, p_data,
    (select jsonb_agg(value || '{"purpose":"credential","mimeType":"application/pdf"}'::jsonb)
      from jsonb_array_elements(p_pdfs)));
$$;
