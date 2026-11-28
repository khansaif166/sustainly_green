begin;

do $$
<<news_images>>
declare
  admin_id uuid := gen_random_uuid();
  owner_id uuid := gen_random_uuid();
  vendor_id uuid := gen_random_uuid();
  image_id uuid;
  gallery_id uuid;
  image_data jsonb;
begin
  insert into public.profiles(id, legacy_firebase_uid, name, email, role, vendor_approved) values
    (admin_id, admin_id::text, 'News Admin', admin_id || '@rich-profile.test', 'ADMIN', false),
    (owner_id, owner_id::text, 'News Owner', owner_id || '@rich-profile.test', 'VENDOR', true);
  insert into public.vendors(id, profile_id, company_name, approved) values
    (vendor_id, owner_id, 'News Test Supplier', true);
  image_data := jsonb_build_object(
    'title', 'Update photo', 'storagePath', vendor_id || '/news', 'mimeType', 'image/png'
  );

  begin
    perform public.add_vendor_rich_news_image(vendor_id, owner_id, image_data);
    raise exception 'Inactive vendor uploaded a news image';
  exception when insufficient_privilege then null;
  end;

  perform public.write_vendor_rich_profile(vendor_id, admin_id, 'activate', '{"active":true}');
  image_id := (public.add_vendor_rich_news_image(vendor_id, owner_id, image_data)->>'id')::uuid;
  gallery_id := (public.write_vendor_rich_profile(vendor_id, owner_id, 'add_media',
    image_data || jsonb_build_object('purpose', 'gallery', 'storagePath', vendor_id || '/gallery'))->>'id')::uuid;

  if not exists (
      select 1 from public.vendor_rich_media
      where id = image_id and purpose = 'gallery' and news_record_only
    ) or not exists (
      select 1 from public.vendor_rich_media
      where id = gallery_id and purpose = 'gallery' and not news_record_only
    ) then
    raise exception 'News and regular gallery images must have different visibility';
  end if;

  begin
    perform public.add_vendor_rich_news_image(vendor_id, owner_id, image_data || '{"mimeType":"application/pdf"}');
    raise exception 'A non-image file was accepted';
  exception when check_violation then null;
  end;

  if has_function_privilege('anon', 'public.add_vendor_rich_news_image(uuid, uuid, jsonb)', 'execute')
    or has_function_privilege('authenticated', 'public.add_vendor_rich_news_image(uuid, uuid, jsonb)', 'execute')
    or not has_function_privilege('service_role', 'public.add_vendor_rich_news_image(uuid, uuid, jsonb)', 'execute') then
    raise exception 'News image upload must be callable by the service role only';
  end if;
end
$$;

rollback;
