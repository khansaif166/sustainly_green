-- Keep existing standalone uploads public. Files used by credential records
-- stay in Saved files but only appear publicly while a record uses them.
alter table public.vendor_rich_media
  add column credential_record_only boolean not null default false;

update public.vendor_rich_media as media
set credential_record_only = true
from public.vendor_rich_profiles as profile
where media.vendor_id = profile.vendor_id and (
  (media.purpose = 'credential' and exists (
    select 1 from jsonb_array_elements(profile.content->'certificates') as record
    where record.value->>'documentId' = media.id::text
  )) or
  (media.purpose = 'award' and exists (
    select 1 from jsonb_array_elements(profile.content->'awards') as record
    where record.value->>'imageId' = media.id::text
  ))
);

create function public.check_rich_credential_attachments()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  reference record;
begin
  -- The profile write RPC holds the vendor lock, which also serializes file
  -- deletion. Check references here for saves with or without new uploads.
  for reference in
    select distinct purpose, media_id from (
      select 'credential' as purpose, value->>'documentId' as media_id
      from jsonb_array_elements(new.content->'certificates')
      union all
      select 'award', value->>'imageId'
      from jsonb_array_elements(new.content->'awards')
    ) as attachments
    where nullif(media_id, '') is not null
  loop
    if not exists (
      select 1 from public.vendor_rich_media as media
      where media.vendor_id = new.vendor_id and media.purpose = reference.purpose
        and media.id::text = reference.media_id
    ) then
      raise exception 'An award image or certification PDF is unavailable. Reload the editor before saving.' using errcode = '23514';
    end if;

    update public.vendor_rich_media as media
    set credential_record_only = true
    where media.vendor_id = new.vendor_id and media.purpose = reference.purpose
      and media.id::text = reference.media_id and not media.credential_record_only;
  end loop;
  return new;
end;
$$;

revoke all on function public.check_rich_credential_attachments() from public, anon, authenticated;

create trigger check_rich_credential_attachments
  before update of content on public.vendor_rich_profiles
  for each row execute function public.check_rich_credential_attachments();
