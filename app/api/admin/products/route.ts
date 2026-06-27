import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import {
  buildAdminProductPayload,
  getAdminProductMasters,
  loadAdminVendor,
  mapMastersForForms,
  mapMastersForList,
  mapProduct,
  PRODUCT_SELECT,
  type ProductRow,
  replaceImages,
  replaceTags,
} from "@/lib/adminProductsServer";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const url = new URL(request.url);
    const includeMasters = url.searchParams.get("masters") === "1";

    const [products, masters] = await Promise.all([
      supabaseServiceFetch<ProductRow[]>(
        `/rest/v1/products?${new URLSearchParams({ select: PRODUCT_SELECT, order: "created_at.desc", limit: "500" })}`,
      ),
      getAdminProductMasters(),
    ]);

    return apiOk({
      ok: true,
      products: products.map(mapProduct),
      ...mapMastersForList(masters),
      ...(includeMasters ? { masters: mapMastersForForms(masters) } : {}),
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
