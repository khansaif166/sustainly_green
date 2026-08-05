import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceCount,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import {
  buildAdminProductFilterParams,
  buildAdminProductPayload,
  getAdminCategoryMap,
  getAdminProductMasters,
  loadAdminVendor,
  mapMastersForForms,
  mapProductListItem,
  PRODUCT_LIST_SELECT,
  type ProductListRow,
  type ProductRow,
  replaceImages,
  replaceTags,
} from "@/lib/adminProductsServer";

const PRODUCTS_PAGE_SIZE = 24;


export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const url = new URL(request.url);
    const includeMasters = url.searchParams.get("masters") === "1";

    // The new-product form only needs master lists for its dropdowns; it never
    // reads the product list. Skip the 500-row product scan + per-row mapping
    // in that case — that work was blowing the Worker CPU budget for no reason.
    if (includeMasters) {
      const masters = await getAdminProductMasters();
      return apiOk({
        ok: true,
        masters: mapMastersForForms(masters),
      });
    }

    // The hero counts and category dropdown don't change per keystroke/filter —
    // let the client fetch them once on mount instead of on every list request,
    // so a search/status/category/page change only costs one Supabase call.
    if (url.searchParams.get("summary") === "1") {
      const [categories, total, pending, approved] = await Promise.all([
        getAdminCategoryMap(),
        supabaseServiceCount("/rest/v1/products"),
        supabaseServiceCount("/rest/v1/products?status=eq.PENDING"),
        supabaseServiceCount("/rest/v1/products?status=eq.APPROVED"),
      ]);

      return apiOk({
        ok: true,
        categories,
        counts: { total, pending, approved },
      });
    }

    // On-demand list: return one page (24) that already matches the current
    // search/status/category, so the Worker never scans or transfers the whole
    // catalogue. Search and filtering run in Postgres, not the browser.
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const offset = (page - 1) * PRODUCTS_PAGE_SIZE;

    const filters = buildAdminProductFilterParams({
      q: url.searchParams.get("q") || "",
      status: url.searchParams.get("status") || "",
      category: url.searchParams.get("category") || "",
    });

    const listParams = new URLSearchParams(filters);
    listParams.set("select", PRODUCT_LIST_SELECT);
    listParams.set("order", "created_at.desc");
    listParams.set("limit", String(PRODUCTS_PAGE_SIZE));
    listParams.set("offset", String(offset));

    const products = await supabaseServiceFetch<ProductListRow[]>(
      `/rest/v1/products?${listParams.toString()}`,
    );

    return apiOk({
      ok: true,
      products: products.map(mapProductListItem),
      page,
      pageSize: PRODUCTS_PAGE_SIZE,
      hasMore: products.length === PRODUCTS_PAGE_SIZE,
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_PRODUCTS_GET_API_ERROR", error);
    return apiError("Unable to load admin products.", 503);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const body = await request.json();
    const vendorId = typeof body.vendorId === "string" ? body.vendorId : "";

    if (!vendorId) return apiError("Please select a vendor.", 400);

    const vendor = await loadAdminVendor(vendorId);
    if (!vendor) return apiError("Vendor not found.", 404);

    const payload = buildAdminProductPayload(
      { ...body, status: body.status || "APPROVED", approved: body.approved ?? true },
      vendor,
    );

    const rows = await supabaseServiceFetch<ProductRow[]>("/rest/v1/products", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        ...payload,
        featured: Boolean(body.featured),
        is_ad: Boolean(body.isAd),
      }),
    });

    const product = rows[0];
    await Promise.all([
      replaceImages(product.id, body.images),
      replaceTags(product.id, body.sustainabilityTagIds),
    ]);

    return apiOk({ ok: true, product }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && error.message === "Listing title is required.") {
      return apiError(error.message, 400);
    }
    console.error("ADMIN_PRODUCTS_POST_API_ERROR", error);
    return apiError("Unable to create product.", 503);
  }
}
