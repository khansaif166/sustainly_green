alter table public.products
  add column moq_unit text,
  add constraint products_moq_unit_requires_quantity
    check (moq_unit is null or (moq is not null and moq > 0));
