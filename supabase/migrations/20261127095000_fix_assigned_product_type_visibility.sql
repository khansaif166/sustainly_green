alter policy "public read active or assigned product types" on public.product_types
  using (active = true or public.is_admin() or exists (
    select 1
    from public.products as product
    where product.product_type_id = product_types.id and product.approved = true
  ));
