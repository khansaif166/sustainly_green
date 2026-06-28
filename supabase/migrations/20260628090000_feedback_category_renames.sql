-- Category label updates from user testing feedback.
-- Slugs are updated only when the target slug is not already used.

with rename_map(old_name, new_name, new_slug) as (
  values
    ('Water & Waste Water Solutions', 'Water Solutions', 'water-solutions'),
    ('Baby Kids and Family', 'Family & Child Care', 'family-child-care'),
    ('Eco-friendly homes and Lifestyle products', 'Eco Home & Living Products', 'eco-home-living-products'),
    ('Circular Economy and Recycling Services', 'Recycling Services', 'recycling-services'),
    ('Green mobility & Transport system', 'Sustainable Mobility & Transport', 'sustainable-mobility-transport'),
    ('Sustainable Logistics & Supplychain Services', 'Sustainable Logistics', 'sustainable-logistics'),
    ('Green Build & Materials', 'Green Building Materials', 'green-building-materials'),
    ('Natural Organic and Personal Care Products', 'Natural & Organic Personal Care', 'natural-organic-personal-care'),
    ('Renewable Energy & Efficiency Technologies', 'Energy & Efficiency', 'energy-efficiency')
)
update public.categories as categories
set
  name = rename_map.new_name,
  slug = case
    when not exists (
      select 1
      from public.categories as existing
      where existing.slug = rename_map.new_slug
        and existing.id <> categories.id
    )
    then rename_map.new_slug
    else categories.slug
  end,
  updated_at = now()
from rename_map
where lower(categories.name) = lower(rename_map.old_name);
