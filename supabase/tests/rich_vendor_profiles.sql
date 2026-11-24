-- Run against a local database after applying the migrations.
begin;

do $$
<<rich_vendor_profiles>>
declare
  admin_id uuid := gen_random_uuid();
  owner_id uuid := gen_random_uuid();
  outsider_id uuid := gen_random_uuid();
  vendor_id uuid := gen_random_uuid();
  unapproved_id uuid := gen_random_uuid();
  item_id uuid;
  replacement_id uuid;
  kind text;
  max_ads integer;
  i integer;
  body jsonb;
  inactive boolean;
begin
  insert into public.profiles(id, legacy_firebase_uid, name, email, role, vendor_approved) values
    (admin_id, admin_id::text, 'Test Admin', admin_id || '@rich-profile.test', 'ADMIN', false),
    (owner_id, owner_id::text, 'Test Owner', owner_id || '@rich-profile.test', 'VENDOR', true),
    (outsider_id, outsider_id::text, 'Test Outsider', outsider_id || '@rich-profile.test', 'VENDOR', true);
  insert into public.vendors(id, profile_id, company_name, approved) values
    (vendor_id, owner_id, 'Rich Profile Test Supplier', true),
    (unapproved_id, outsider_id, 'Unapproved Rich Profile Test Supplier', false);

  if exists (select 1 from public.vendor_rich_profiles p where p.vendor_id = rich_vendor_profiles.vendor_id) then
    raise exception 'A new vendor should start in Basic';
  end if;
  begin
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'activate', '{"active":true}');
    raise exception 'Vendor was allowed to activate Rich';
  exception when insufficient_privilege then null;
  end;

  perform public.write_vendor_rich_profile(vendor_id, admin_id, 'activate', '{"active":true}');
  perform public.write_vendor_rich_profile(unapproved_id, admin_id, 'activate', '{"active":true}');
  begin
    perform public.write_vendor_rich_profile(unapproved_id, outsider_id, 'content', '{"revision":0,"content":{}}');
    raise exception 'Unapproved vendor was allowed to edit Rich';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.write_vendor_rich_profile(vendor_id, outsider_id, 'content', '{"revision":0,"content":{}}');
    raise exception 'A different vendor was allowed to edit Rich';
  exception when no_data_found then null;
  end;
  perform public.write_vendor_rich_profile(vendor_id, admin_id, 'content',
    '{"revision":0,"content":{"claimStatus":"Sustainly Reviewed"}}');
  perform public.write_vendor_rich_profile(vendor_id, owner_id, 'content',
    '{"revision":1,"content":{"claimStatus":"Third-Party Certified","fields":{"brandName":"Saved vendor name"}}}');
  begin
    perform public.write_vendor_rich_profile(vendor_id, admin_id, 'content', '{"revision":1,"content":{}}');
    raise exception 'An out-of-date edit overwrote a newer save';
  exception when serialization_failure then null;
  end;
  if not exists (select 1 from public.vendor_rich_profiles p
      where p.vendor_id = rich_vendor_profiles.vendor_id and p.content->>'claimStatus' = 'Sustainly Reviewed') then
    raise exception 'Vendor changed the admin verification status';
  end if;

  perform public.write_vendor_rich_profile(vendor_id, owner_id, 'add_media',
    '{"purpose":"intro","title":"Introduction","sourceUrl":"https://example.test/intro.mp4"}');
  for i in 1..2 loop
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'add_media',
      jsonb_build_object('purpose', 'video', 'title', 'Profile video', 'sourceUrl', 'https://example.test/' || i || '.mp4'));
  end loop;
  begin
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'add_media',
      '{"purpose":"video","title":"Fourth profile video","sourceUrl":"https://example.test/4.mp4"}');
    raise exception 'The shared profile video limit was exceeded';
  exception when check_violation then null;
  end;

  foreach kind in array array['banner', 'video'] loop
    max_ads := case kind when 'banner' then 5 else 3 end;
    for i in 1..max_ads loop
      body := jsonb_build_object('kind', kind, 'title', 'Creative ' || i,
        'sourceUrl', 'https://example.test/' || i, 'sourceKey', 'creative:' || i, 'sortOrder', i, 'enabled', true);
      replacement_id := (public.write_vendor_rich_profile(vendor_id, owner_id, 'save_ad', body)->>'id')::uuid;
      if i = 1 then item_id := replacement_id; end if;
    end loop;
    body := body || '{"sourceKey":"creative:next"}'::jsonb;
    begin
      perform public.write_vendor_rich_profile(vendor_id, admin_id, 'save_ad', body);
      raise exception 'The % limit was exceeded', kind;
    exception when check_violation then null;
    end;

    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'save_ad',
      jsonb_build_object('id', item_id, 'title', 'Edited at the cap', 'sortOrder', 0, 'enabled', false));
    perform public.write_vendor_rich_profile(vendor_id, admin_id, 'moderate', jsonb_build_object('id', item_id, 'enabled', false));
    begin
      perform public.write_vendor_rich_profile(vendor_id, owner_id, 'moderate', jsonb_build_object('id', item_id, 'enabled', true));
      raise exception 'Vendor lifted an admin block';
    exception when insufficient_privilege then null;
    end;
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'save_ad', jsonb_build_object(
      'id', item_id, 'title', 'Blocked replacement', 'sourceUrl', 'https://example.test/new',
      'sourceKey', 'creative:replacement', 'sortOrder', 0, 'enabled', true));
    if not exists (select 1 from public.vendor_rich_ads where id = item_id and not admin_enabled and vendor_enabled) then
      raise exception 'Vendor replaced the ad and cleared its block';
    end if;
    begin
      perform public.write_vendor_rich_profile(vendor_id, owner_id, 'save_ad', body);
      raise exception 'A blocked ad did not count towards the % limit', kind;
    exception when check_violation then null;
    end;
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'delete_ad', jsonb_build_object('id', item_id));
    foreach body in array array[
      body || '{"sourceKey":"creative:1"}'::jsonb,
      body || '{"sourceKey":"creative:replacement"}'::jsonb
    ] loop
      begin
        perform public.write_vendor_rich_profile(vendor_id, owner_id, 'save_ad', body);
        raise exception 'Reuploading a blocked creative bypassed moderation';
      exception when check_violation then null;
      end;
    end loop;
    perform public.write_vendor_rich_profile(vendor_id, admin_id, 'moderate', jsonb_build_object('id', item_id, 'enabled', true));
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'save_ad', body);
  end loop;

  select id into item_id from public.vendor_rich_ads a
    where a.vendor_id = rich_vendor_profiles.vendor_id and a.kind = 'banner' and a.deleted_at is null limit 1;
  perform public.write_vendor_rich_profile(vendor_id, admin_id, 'moderate', jsonb_build_object('id', item_id, 'enabled', false));
  perform public.write_vendor_rich_profile(vendor_id, admin_id, 'activate', '{"active":false}');
  begin
    perform public.write_vendor_rich_profile(vendor_id, owner_id, 'save_ad', body);
    raise exception 'Vendor managed ads on a disabled profile';
  exception when insufficient_privilege then null;
  end;
  select not active into inactive from public.vendor_rich_profiles p where p.vendor_id = rich_vendor_profiles.vendor_id;
  if inactive is distinct from true then raise exception 'Deactivation was not saved'; end if;
  perform public.write_vendor_rich_profile(vendor_id, admin_id, 'activate', '{"active":true}');
  if not exists (select 1 from public.vendor_rich_profiles p where p.vendor_id = rich_vendor_profiles.vendor_id and p.active
      and p.content->'fields'->>'brandName' = 'Saved vendor name') then
    raise exception 'Profile content was lost on reactivation';
  end if;
  if (select count(*) from public.vendor_rich_ads a where a.vendor_id = rich_vendor_profiles.vendor_id and a.deleted_at is null) <> 8 then
    raise exception 'Deactivation changed live ad inventory';
  end if;
  if not exists (select 1 from public.vendor_rich_ads where id = item_id and not admin_enabled and vendor_enabled) then
    raise exception 'Deactivation changed ad switches';
  end if;
  if has_function_privilege('authenticated', 'public.write_vendor_rich_profile(uuid, uuid, text, jsonb)', 'EXECUTE') then
    raise exception 'Authenticated clients must not execute the write RPC directly';
  end if;
end
$$;

rollback;
