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

/**
 * Canonical href for a blog post. Posts carrying a slug use /blogs/{slug};
 * anything without one falls back to the UUID form. Both resolve — see
 * fetchPublishedBlogById in lib/supabasePublic.ts.
 */
export function blogHref(id: string, slug?: string | null): string {
  return `/blogs/${slug || id}`;
}

/**
 * Public URL for a vendor: /find-vendors/{slug}, e.g. /find-vendors/ea-water-private-limited.
 * The uuid form still resolves and redirects there — see
 * app/find-vendors/[vendorId]/page.tsx.
 */
export function vendorHref(id: string, slug?: string | null): string {
  return `/find-vendors/${encodeURIComponent(slug || id)}`;
}

/**
 * Canonical /browse href for a category: the slug form, which is what
 * sitemap-categories.xml lists and the browse page canonicalises to. Linking
 * the UUID form gave every category a second, competing URL.
 */
export function categoryHref(id: string, slug?: string | null): string {
  // Lower-cased like the sitemap and the canonical, so all three always match.
  return `/browse?category=${encodeURIComponent(slug ? slug.toLowerCase() : id)}`;
}
