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
