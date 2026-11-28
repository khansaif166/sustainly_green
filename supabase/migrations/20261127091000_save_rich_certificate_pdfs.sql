create function public.save_rich_certificate_pdfs(
  p_vendor_id uuid, p_actor_profile_id uuid, p_data jsonb, p_pdfs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pdf record;
  document jsonb;
  certificates jsonb := p_data->'content'->'certificates';
  uploaded_indexes integer[] := '{}';
begin
  if jsonb_typeof(certificates) is distinct from 'array'
      or jsonb_typeof(p_pdfs) is distinct from 'array'
      or jsonb_array_length(p_pdfs) = 0 then
    raise exception 'Certification PDFs require a certificate record.' using errcode = '23514';
  end if;

  -- The existing actions retain the vendor lock through this transaction.
  for pdf in select * from jsonb_to_recordset(p_pdfs) as input(
    "index" integer, title text, "storagePath" text
  ) loop
    if pdf."index" is null or pdf."index" < 0
        or pdf."index" = any(uploaded_indexes)
        or jsonb_typeof(certificates->pdf."index") is distinct from 'object'
        or not (certificates->pdf."index" ? 'documentId')
        or nullif(btrim(pdf.title), '') is null or length(pdf.title) > 120
        or pdf."storagePath" is null or pdf."storagePath" not like p_vendor_id::text || '/%' then
      raise exception 'Choose one PDF for an existing certificate record.' using errcode = '23514';
    end if;
    uploaded_indexes := array_append(uploaded_indexes, pdf."index");
    document := public.write_vendor_rich_profile(p_vendor_id, p_actor_profile_id, 'add_media',
      jsonb_build_object('purpose', 'credential', 'title', pdf.title,
        'storagePath', pdf."storagePath", 'mimeType', 'application/pdf'));
    p_data := jsonb_set(p_data, array['content', 'certificates', pdf."index"::text, 'documentId'],
      to_jsonb(document->>'id'), false);
  end loop;

  if exists (
    select 1 from jsonb_array_elements(p_data->'content'->'certificates') as entry(value)
    where nullif(entry.value->>'documentId', '') is not null and not exists (
      select 1 from public.vendor_rich_media as asset
      where asset.vendor_id = p_vendor_id and asset.purpose = 'credential'
        and asset.id::text = entry.value->>'documentId'
    )
  ) then
    raise exception 'A certification PDF was removed. Reload the editor before saving.' using errcode = '23514';
  end if;

  return public.write_vendor_rich_profile(p_vendor_id, p_actor_profile_id, 'content', p_data);
end;
$$;

revoke all on function public.save_rich_certificate_pdfs(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_rich_certificate_pdfs(uuid, uuid, jsonb, jsonb) to service_role;
