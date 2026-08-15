import { getSiteUrl } from "@/lib/site";
import { productHref } from "@/lib/slug";

type DatedRow = {
  id: string;
  updated_at: string;
};

type ProductSeoRow = DatedRow & {
  title: string | null;
};

type VendorSeoRow = DatedRow & {
  short_description: string | null;
  primary_sustainability_cert: string | null;
};

type CategorySeoRow = DatedRow & {
  slug: string;
};

type BlogSeoRow = DatedRow;

const PAGE_SIZE = 1000;
const MAX_URLS = 50_000;

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing public Supabase configuration.");
  return { url, key };
}

async function fetchRows<T>(resource: string, query: URLSearchParams) {
  const { url, key } = config();
  const rows: T[] = [];

  for (let offset = 0; offset < MAX_URLS; offset += PAGE_SIZE) {
    const pageQuery = new URLSearchParams(query);
    pageQuery.set("limit", String(PAGE_SIZE));
    pageQuery.set("offset", String(offset));

    const response = await fetch(
      `${url}/rest/v1/${resource}?${pageQuery.toString()}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      throw new Error(`Unable to build ${resource} sitemap.`);
    }

    const page = (await response.json()) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows.slice(0, MAX_URLS);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export function urlSet(
  entries: Array<{ url: string; lastModified?: string }>,
) {
  const urls = entries
    .map(
      ({ url, lastModified }) => `<url><loc>${escapeXml(url)}</loc>${
        lastModified
          ? `<lastmod>${escapeXml(new Date(lastModified).toISOString())}</lastmod>`
          : ""
      }</url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function sitemapIndex(paths: string[]) {
  const siteUrl = getSiteUrl();
  const entries = paths
    .map(
      (path) =>
        `<sitemap><loc>${escapeXml(`${siteUrl}/${path}`)}</loc></sitemap>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export async function productSitemapEntries() {
  const query = new URLSearchParams({
    select: "id,updated_at,title",
    approved: "eq.true",
    order: "id.asc",
  });
  const rows = await fetchRows<ProductSeoRow>("products", query);
  const siteUrl = getSiteUrl();
  return rows.map((row) => ({
    url: `${siteUrl}${productHref(row.id, row.title)}`,
    lastModified: row.updated_at,
  }));
}

export async function vendorSitemapEntries() {
  const vendorQuery = new URLSearchParams({
    select: "id,updated_at,short_description,primary_sustainability_cert",
    approved: "eq.true",
    short_description: "not.is.null",
    primary_sustainability_cert: "not.is.null",
    order: "id.asc",
  });
  const productQuery = new URLSearchParams({
    select: "vendor_id",
    approved: "eq.true",
    order: "vendor_id.asc",
  });

  const [vendors, products] = await Promise.all([
    fetchRows<VendorSeoRow>("vendors", vendorQuery),
    fetchRows<{ vendor_id: string }>("products", productQuery),
  ]);
  const vendorsWithProducts = new Set(products.map((row) => row.vendor_id));
  const siteUrl = getSiteUrl();

  return vendors
    .filter((vendor) => vendorsWithProducts.has(vendor.id))
    .map((vendor) => ({
      url: `${siteUrl}/find-vendors/${encodeURIComponent(vendor.id)}`,
      lastModified: vendor.updated_at,
    }));
}

export async function categorySitemapEntries() {
  const categoryQuery = new URLSearchParams({
    select: "id,slug,updated_at",
    active: "eq.true",
    order: "id.asc",
  });
  const productQuery = new URLSearchParams({
    select: "category_id",
    approved: "eq.true",
    category_id: "not.is.null",
    order: "category_id.asc",
  });
  const [categories, products] = await Promise.all([
    fetchRows<CategorySeoRow>("categories", categoryQuery),
    fetchRows<{ category_id: string }>("products", productQuery),
  ]);
  const populatedCategories = new Set(products.map((row) => row.category_id));
  const siteUrl = getSiteUrl();

  return categories
    .filter((category) => populatedCategories.has(category.id))
    .map((category) => ({
      url: `${siteUrl}/browse?category=${encodeURIComponent(
        category.slug.toLowerCase(),
      )}`,
      lastModified: category.updated_at,
    }));
}

export async function blogSitemapEntries() {
  const query = new URLSearchParams({
    select: "id,updated_at",
    published: "eq.true",
    order: "id.asc",
  });
  const rows = await fetchRows<BlogSeoRow>("blogs", query);
  const siteUrl = getSiteUrl();
  return rows.map((row) => ({
    url: `${siteUrl}/blogs/${encodeURIComponent(row.id)}`,
    lastModified: row.updated_at,
  }));
}
