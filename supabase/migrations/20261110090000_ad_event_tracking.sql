-- Ad impression / click tracking for promoted products.
--
-- products.impressions and products.clicks existed but nothing ever wrote to
-- them, so the admin Ads page always showed 0. record_ad_event() increments
-- them atomically; the public site calls it through /api/ads/track using the
-- service role, so it is not executable by anon or signed-in users directly.

-- A counter bump is not a content change. Without this, every impression
-- would move products.updated_at, which feeds the sitemap <lastmod> and would
-- tell Google the page changed on every ad view.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and current_setting('app.counter_only_update', true) = 'on' then
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end;
$$;

create or replace function public.record_ad_event(p_product_id uuid, p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event not in ('impression', 'click') then
    raise exception 'Unknown ad event: %', p_event using errcode = '22023';
  end if;

  -- Transaction-local: only affects the update below.
  perform set_config('app.counter_only_update', 'on', true);

  -- Only live ads count, so stale tabs or forged requests for other products
  -- can't inflate numbers.
  update public.products
     set impressions = impressions + case when p_event = 'impression' then 1 else 0 end,
         clicks      = clicks      + case when p_event = 'click'      then 1 else 0 end
   where id = p_product_id
     and is_ad
     and ad_status = 'APPROVED'
     and ad_active;

  perform set_config('app.counter_only_update', 'off', true);
end;
$$;

revoke all on function public.record_ad_event(uuid, text) from public, anon, authenticated;
grant execute on function public.record_ad_event(uuid, text) to service_role;
