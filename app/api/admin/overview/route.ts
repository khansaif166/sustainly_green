import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type ProfileRow = {
  id: string;
  email: string;
  role: string;
  name: string | null;
};

type VendorRow = {
  id: string;
  company_name: string;
  approved: boolean;
  status: string;
};

type ProductRow = {
  id: string;
  title: string;
  category_id: string | null;
  status: string;
  approved: boolean;
  created_at: string;
};

type RfqRow = {
  id: string;
  requirement_title: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  estimated_quantity: string | null;
  delivery_country: string | null;
  vendor_id: string | null;
  status: string;
  vendor_response: Record<string, unknown> | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

function mapRfq(row: RfqRow) {
  return {
    id: row.id,
    type: "DIRECT",
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone || "",
    requirementTitle: row.requirement_title,
    estimatedQuantity: row.estimated_quantity || "",
    deliveryCountry: row.delivery_country || "",
    vendorId: row.vendor_id || "",
    status: row.status,
    vendorResponse: row.vendor_response || undefined,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const [
      users,
      vendors,
      products,
      rfqs,
      categories,
      recentRFQs,
      recentProducts,
    ] = await Promise.all([
      supabaseServiceFetch<ProfileRow[]>("/rest/v1/profiles?select=id,email,role,name&order=created_at.desc&limit=10000"),
      supabaseServiceFetch<VendorRow[]>("/rest/v1/vendors?select=id,company_name,approved,status&order=created_at.desc&limit=10000"),
      supabaseServiceFetch<ProductRow[]>("/rest/v1/products?select=id,title,category_id,status,approved,created_at&order=created_at.desc&limit=10000"),
      supabaseServiceFetch<RfqRow[]>("/rest/v1/rfqs?select=id,requirement_title,buyer_name,buyer_email,buyer_phone,estimated_quantity,delivery_country,vendor_id,status,vendor_response,created_at&order=created_at.desc&limit=10000"),
      supabaseServiceFetch<CategoryRow[]>("/rest/v1/categories?select=id,name&order=name.asc&limit=10000"),
      supabaseServiceFetch<RfqRow[]>("/rest/v1/rfqs?select=id,requirement_title,buyer_name,buyer_email,buyer_phone,estimated_quantity,delivery_country,vendor_id,status,vendor_response,created_at&order=created_at.desc&limit=5"),
      supabaseServiceFetch<ProductRow[]>("/rest/v1/products?select=id,title,category_id,status,approved,created_at&order=created_at.desc&limit=5"),
    ]);

    return apiOk({
      ok: true,
      users,
      vendors: vendors.map((vendor) => ({
        id: vendor.id,
        company: vendor.company_name,
        companyName: vendor.company_name,
        approved: vendor.approved,
        status: vendor.status,
      })),
      products: products.map((product) => ({
        id: product.id,
        title: product.title,
        categoryId: product.category_id,
        status: product.status,
        approved: product.approved,
        createdAt: product.created_at,
      })),
      rfqs: rfqs.map(mapRfq),
      categories: Object.fromEntries(categories.map((category) => [category.id, category.name])),
      recentRFQs: recentRFQs.map(mapRfq),
      recentProducts: recentProducts.map((product) => ({
        id: product.id,
        title: product.title,
        categoryId: product.category_id,
        status: product.status,
        approved: product.approved,
        createdAt: product.created_at,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_OVERVIEW_API_ERROR", error);
    return apiError("Unable to load admin overview.", 503);
  }
}
