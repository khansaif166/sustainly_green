-- Return the complete admin dashboard summary without sending full tables
-- through the application Worker.

create index if not exists products_status_idx
  on public.products (status);

create index if not exists products_category_id_idx
  on public.products (category_id);

create index if not exists products_created_at_idx
  on public.products (created_at desc);

create index if not exists rfqs_created_at_idx
  on public.rfqs (created_at desc);

create or replace function public.admin_overview()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'counts',
    jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'vendors', (select count(*) from public.vendors),
      'pendingVendors', (select count(*) from public.vendors where approved = false),
      'approvedVendors', (select count(*) from public.vendors where approved = true),
      'products', (select count(*) from public.products),
      'pendingProducts', (select count(*) from public.products where status = 'PENDING'),
      'approvedProducts', (select count(*) from public.products where status = 'APPROVED'),
      'rfqs', (select count(*) from public.rfqs)
    ),
    'productsByCategory',
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('name', category_counts.name, 'value', category_counts.value)
          order by category_counts.value desc, category_counts.name asc
        ),
        '[]'::jsonb
      )
      from (
        select coalesce(c.name, 'Other') as name, count(*) as value
        from public.products p
        left join public.categories c on c.id = p.category_id
        group by coalesce(c.name, 'Other')
      ) category_counts
    ),
    'recentRFQs',
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', recent.id,
            'requirementTitle', recent.requirement_title,
            'buyerName', recent.buyer_name,
            'estimatedQuantity', recent.estimated_quantity,
            'deliveryCountry', recent.delivery_country,
            'requiredTimeline', recent.required_timeline,
            'status', recent.status,
            'createdAt', recent.created_at
          )
          order by recent.created_at desc
        ),
        '[]'::jsonb
      )
      from (
        select
          id,
          requirement_title,
          buyer_name,
          estimated_quantity,
          delivery_country,
          required_timeline,
          status,
          created_at
        from public.rfqs
        order by created_at desc
        limit 5
      ) recent
    ),
    'recentProducts',
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', recent.id,
            'title', recent.title,
            'listingType', recent.listing_type,
            'price', recent.price,
            'status', recent.status,
            'createdAt', recent.created_at
          )
          order by recent.created_at desc
        ),
        '[]'::jsonb
      )
      from (
        select id, title, listing_type, price, status, created_at
        from public.products
        order by created_at desc
        limit 5
      ) recent
    )
  );
$$;

revoke all on function public.admin_overview() from public;
revoke all on function public.admin_overview() from anon;
revoke all on function public.admin_overview() from authenticated;
grant execute on function public.admin_overview() to service_role;
