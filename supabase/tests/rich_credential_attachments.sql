-- Run against a local database after applying the migrations.
begin;

do $$
<<credential_attachments>>
declare
  admin_id uuid := gen_random_uuid();
  owner_id uuid := gen_random_uuid();
  vendor_id uuid := gen_random_uuid();
  document_id uuid;
  image_id uuid;
  standalone_id uuid;
  body jsonb;
begin
  insert into public.profiles(id, legacy_firebase_uid, name, email, role, vendor_approved) values
    (admin_id, admin_id::text, 'Credentials Admin', admin_id || '@rich-profile.test', 'ADMIN', false),
    (owner_id, owner_id::text, 'Credentials Owner', owner_id || '@rich-profile.test', 'VENDOR', true);
  insert into public.vendors(id, profile_id, company_name, approved) values
    (vendor_id, owner_id, 'Credentials Test Supplier', true);
  perform public.write_vendor_rich_profile(vendor_id, admin_id, 'activate', '{"active":true}');
  standalone_id := (public.write_vendor_rich_profile(vendor_id, admin_id, 'add_media', jsonb_build_object(
    'purpose', 'credential', 'title', 'Standalone PDF', 'storagePath', vendor_id || '/standalone', 'mimeType', 'application/pdf'))->>'id')::uuid;
  select p.content || '{"certificates":[{"name":"Certificate","documentId":""}],"awards":[{"name":"Award","imageId":""}]}'::jsonb
    into body from public.vendor_rich_profiles p where p.vendor_id = credential_attachments.vendor_id;
  perform public.save_rich_content_attachments(vendor_id, owner_id, jsonb_build_object('revision', 0, 'content', body),
    jsonb_build_array(
      jsonb_build_object('index', 0, 'title', 'Certificate PDF', 'purpose', 'credential', 'storagePath', vendor_id || '/certificate', 'mimeType', 'application/pdf'),
      jsonb_build_object('index', 0, 'title', 'Award image', 'purpose', 'award', 'storagePath', vendor_id || '/award', 'mimeType', 'image/png')
    ));
  select p.content into body from public.vendor_rich_profiles p where p.vendor_id = credential_attachments.vendor_id;
  document_id := (body #>> '{certificates,0,documentId}')::uuid;
  image_id := (body #>> '{awards,0,imageId}')::uuid;
  if document_id is null or image_id is null or
      (select count(*) from public.vendor_rich_media where id in (document_id, image_id) and credential_record_only) <> 2 or
      (select credential_record_only from public.vendor_rich_media where id = standalone_id) then
    raise exception 'Linked uploads must be record-only and existing standalone files must stay available';
  end if;

  begin
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'content', jsonb_build_object('revision', 1,
      'content', jsonb_set(body, '{awards,0,imageId}', to_jsonb(document_id))));
    raise exception 'An award linked to a PDF';
  exception when check_violation then null;
  end;
  perform public.write_vendor_rich_profile(vendor_id, owner_id, 'delete_media', jsonb_build_object('id', image_id));
  begin
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'content', jsonb_build_object('revision', 1, 'content', body));
    raise exception 'An edit restored a deleted award image reference';
  exception when check_violation then null;
  end;
  perform public.write_vendor_rich_profile(vendor_id, owner_id, 'content',
    jsonb_build_object('revision', 1, 'content', body || '{"certificates":[],"awards":[]}'::jsonb));
  if not exists (select 1 from public.vendor_rich_media where id = document_id and credential_record_only) then
    raise exception 'Removing a record must keep its PDF available for reuse';
  end if;

end
$$;

rollback;
