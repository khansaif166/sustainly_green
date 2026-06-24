import { supabaseServiceFetch } from "@/lib/supabaseServer";

export type ProductImageRow = {
  url: string | null;
  sort_order: number | null;
};

export type ProductTagRow = {
  tag_id: string;
  tag_name_snapshot: string;
};

export type ProductRow = {
  id: string;
  vendor_id: string;
  vendor_name: string;
  title: string;
  description: string | null;
  listing_type: string | null;
  available_for: string[];
  category_id: string | null;
  subcategory_id: string | null;
  price_type: string | null;
  price: number | string | null;
  currency: string;
  moq: number | string | null;
  discount: string | null;
  ship_regions: string[];
  in_stock: boolean;
  featured: boolean;
  is_ad: boolean;
  sustainability_claim: string | null;
  approved: boolean;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  product_images?: ProductImageRow[];
  product_sustainability_tags?: ProductTagRow[];
};

export type VendorRow = {
  id: string;
  company_name: string;
};

type TagRow = {
  id: string;
  name: string;
};

export const PRODUCT_SELECT = [
  "id",
  "vendor_id",
  "vendor_name",
  "title",
  "description",
  "listing_type",
  "available_for",
  "category_id",
  "subcategory_id",
  "price_type",
  "price",
  "currency",
  "moq",
  "discount",
  "ship_regions",
  "in_stock",
  "featured",
  "is_ad",
  "sustainability_claim",
  "approved",
  "status",
  "views",
  "created_at",
  "updated_at",
  "product_images(url,sort_order)",
  "product_sustainability_tags(tag_id,tag_name_snapshot)",
].join(",");

export function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => stringOrNull(item)).filter(Boolean)
    : [];
}

function numberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapProduct(row: ProductRow) {
  const images = (row.product_images || [])
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((image) => stringOrNull(image.url))
    .filter(Boolean);

  const tags = (row.product_sustainability_tags || []).map((tag) => ({
    id: tag.tag_id,
    name: tag.tag_name_snapshot,
  }));

  return {
    id: row.id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    title: row.title,
    description: row.description || "",
    listingType: row.listing_type || "",
    availableFor: row.available_for || [],
    categoryId: row.category_id || "",
    subCategoryId: row.subcategory_id || "",
    priceType: row.price_type || "",
    price: row.price === null ? "" : String(row.price),
    currency: row.currency || "INR",
    moq: row.moq === null ? "" : String(row.moq),
    discount: row.discount || "",
    shipRegions: row.ship_regions || [],
    inStock: row.in_stock,
    featured: row.featured,
    isAd: row.is_ad,
    sustainabilityClaim: row.sustainability_claim || "",
    sustainabilityTagIds: tags.map((tag) => tag.id),
    sustainabilityTagNames: tags.map((tag) => tag.name),
    images,
    approved: row.approved,
    status: row.status,
    views: row.views,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getVendor(vendorId: string) {
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

export function buildProductPayload(
  body: Record<string, unknown>,
  vendor: VendorRow,
) {
  const title = stringOrNull(body.title);

  if (!title) {
    throw new Error("Listing title is required.");
  }

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
    featured: false,
    is_ad: false,
    sustainability_claim: stringOrNull(body.sustainabilityClaim),
    approved: false,
    status: "PENDING",
  };
}

export async function replaceImages(productId: string, images: unknown) {
  await supabaseServiceFetch<void>(
    `/rest/v1/product_images?${new URLSearchParams({ product_id: `eq.${productId}` })}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    },
  );

  const urls = stringArray(images).slice(0, 5);
  if (!urls.length) return;

  await supabaseServiceFetch<void>("/rest/v1/product_images", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(
      urls.map((url, index) => ({
        product_id: productId,
        url,
        sort_order: index,
      })),
    ),
  });
}

export async function replaceTags(productId: string, selectedTagIds: unknown) {
  await supabaseServiceFetch<void>(
    `/rest/v1/product_sustainability_tags?${new URLSearchParams({ product_id: `eq.${productId}` })}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    },
  );

  const tagIds = stringArray(selectedTagIds).slice(0, 3);
  if (!tagIds.length) return;

  const params = new URLSearchParams({
    select: "id,name",
    id: `in.(${tagIds.join(",")})`,
  });

  const tags = await supabaseServiceFetch<TagRow[]>(
    `/rest/v1/sustainability_tags?${params.toString()}`,
  );

  if (!tags.length) return;

  await supabaseServiceFetch<void>("/rest/v1/product_sustainability_tags", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(
      tags.map((tag) => ({
        product_id: productId,
        tag_id: tag.id,
        tag_name_snapshot: tag.name,
      })),
    ),
  });
}
