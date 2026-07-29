import { supabaseServiceFetch } from "@/lib/supabaseServer";
import {
  PRODUCT_SELECT,
  mapProduct,
  replaceImages,
  replaceTags,
  stringArray,
  stringOrNull,
  type ProductRow,
} from "@/lib/vendorProductsServer";

type VendorRow = {
  id: string;
  company_name: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

type SubcategoryRow = {
  id: string;
  name: string;
  category_id: string;
};

type TagRow = {
  id: string;
  name: string;
};

function numberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Lean projection for the admin product LIST view. It renders only a handful of
// fields, so we avoid the tags join and the unused columns that the full
// PRODUCT_SELECT pulls — smaller payload to parse, less mapping CPU per row.
export const PRODUCT_LIST_SELECT = [
  "id",
  "vendor_name",
  "title",
  "price",
  "price_type",
  "status",
  "featured",
  "is_ad",
  "eco_verified",
  "category_id",
  "created_at",
  "product_images(url,sort_order)",
].join(",");

export type ProductListRow = {
  id: string;
  vendor_name: string | null;
  title: string;
  price: number | null;
  price_type: string | null;
  status: string;
  featured: boolean;
  is_ad: boolean;
  eco_verified: boolean | null;
  category_id: string | null;
  product_images?: Array<{ url: string | null; sort_order: number | null }>;
};

// Translates the admin list filters into PostgREST query params, shared by the
// page query and the pagination count so they always agree on what's matched.
export function buildAdminProductFilterParams(opts: {
  q?: string;
  status?: string;
  category?: string;
}) {
  const params = new URLSearchParams();

  if (opts.status && opts.status !== "ALL") {
    params.set("status", `eq.${opts.status}`);
  }
  if (opts.category && opts.category !== "ALL") {
    params.set("category_id", `eq.${opts.category}`);
  }

  const q = (opts.q || "").trim().replace(/[(),*]/g, " ").trim();
  if (q) {
    params.set("or", `(title.ilike.*${q}*,vendor_name.ilike.*${q}*)`);
  }

  return params;
}

export function mapProductListItem(row: ProductListRow) {
  const firstImage = (row.product_images || [])
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((image) => image.url)
    .find((url): url is string => Boolean(url));

  return {
    id: row.id,
    title: row.title,
    vendorName: row.vendor_name || "",
    price: row.price === null ? "" : String(row.price),
    priceType: row.price_type || "",
    status: row.status,
    featured: row.featured,
    isAd: row.is_ad,
    ecoVerified: Boolean(row.eco_verified),
    categoryId: row.category_id || "",
    images: firstImage ? [firstImage] : [],
  };
}

export async function getAdminCategoryMap() {
  const rows = await supabaseServiceFetch<CategoryRow[]>(
    "/rest/v1/categories?select=id,name&order=name.asc&limit=2000",
  );
  return Object.fromEntries(rows.map((category) => [category.id, category.name]));
}

export async function getAdminProductMasters() {
  const [vendors, categories, subcategories, tags] = await Promise.all([
    supabaseServiceFetch<VendorRow[]>("/rest/v1/vendors?select=id,company_name&order=company_name.asc&limit=10000"),
    supabaseServiceFetch<CategoryRow[]>("/rest/v1/categories?select=id,name&order=name.asc&limit=10000"),
    supabaseServiceFetch<SubcategoryRow[]>("/rest/v1/subcategories?select=id,name,category_id&order=name.asc&limit=10000"),
    supabaseServiceFetch<TagRow[]>("/rest/v1/sustainability_tags?select=id,name&order=name.asc&limit=10000"),
  ]);

  return { vendors, categories, subcategories, tags };
}

export function mapMastersForForms(masters: Awaited<ReturnType<typeof getAdminProductMasters>>) {
  return {
    vendors: masters.vendors.map((vendor) => ({
      id: vendor.id,
      companyName: vendor.company_name,
      name: vendor.company_name,
    })),
    categories: masters.categories,
    subCategories: masters.subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      categoryId: subcategory.category_id,
    })),
    tags: masters.tags,
  };
}

export function mapMastersForList(masters: Awaited<ReturnType<typeof getAdminProductMasters>>) {
  return {
    vendors: Object.fromEntries(masters.vendors.map((vendor) => [vendor.id, vendor.company_name])),
    categories: Object.fromEntries(masters.categories.map((category) => [category.id, category.name])),
    subCategories: Object.fromEntries(masters.subcategories.map((subcategory) => [subcategory.id, subcategory.name])),
  };
}

export async function loadAdminProduct(id: string) {
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    id: `eq.${id}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<ProductRow[]>(
    `/rest/v1/products?${params.toString()}`,
  );

  return rows[0] || null;
}

export async function loadAdminVendor(vendorId: string) {
  const params = new URLSearchParams({
    select: "id,company_name",
    id: `eq.${vendorId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<VendorRow[]>(
    `/rest/v1/vendors?${params.toString()}`,
  );

  return rows[0] || null;
}

export function buildAdminProductPayload(
  body: Record<string, unknown>,
  vendor: VendorRow,
) {
  const title = stringOrNull(body.title);

  if (!title) {
    throw new Error("Listing title is required.");
  }

  const status = stringOrNull(body.status) || "APPROVED";
  const approved = body.approved !== undefined ? Boolean(body.approved) : status === "APPROVED";

  return {
    vendor_id: vendor.id,
    vendor_name: vendor.company_name || "Unknown Vendor",
    title,
    description: stringOrNull(body.description),
    listing_type: stringOrNull(body.listingType),
    available_for: stringArray(body.availableFor),
    category_id: stringOrNull(body.categoryId),
    subcategory_id: stringOrNull(body.subCategoryId),
    price_type: stringOrNull(body.priceType),
    price: numberOrNull(body.price),
    currency: stringOrNull(body.currency) || "INR",
    moq: numberOrNull(body.moq),
    discount: stringOrNull(body.discount),
    ship_regions: stringArray(body.shipRegions),
    in_stock: body.inStock !== false,
    sustainability_claim: stringOrNull(body.sustainabilityClaim),
    approved,
    status,
  };
}

export async function refreshAdminProduct(id: string) {
  const row = await loadAdminProduct(id);
  return row ? mapProduct(row) : null;
}

export { mapProduct, replaceImages, replaceTags };
export { PRODUCT_SELECT };
export type { ProductRow };
