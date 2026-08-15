/**
 * Convert a product/vendor title into a URL-safe slug for the SEO-friendly
 * /products/{id}/{slug} URL pattern. The slug is purely decorative — the id
 * is always the actual lookup key — so this never needs to be reversible or
 * unique on its own.
 */
export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "product";
}

/** Builds the canonical /products/{id}/{slug} href for a product. */
export function productHref(id: string, title?: string | null): string {
  if (!title) return `/products/${id}`;
  return `/products/${id}/${slugify(title)}`;
}
