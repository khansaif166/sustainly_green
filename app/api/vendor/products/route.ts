import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import {
  buildProductPayload,
  getVendor,
  mapProduct,
  PRODUCT_SELECT,
  type ProductRow,
  replaceImages,
  replaceTags,
} from "@/lib/vendorProductsServer";


export async function GET(request: Request) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiOk({ ok: true, needsOnboarding: true, products: [] });
    }

    const params = new URLSearchParams({
      select: PRODUCT_SELECT,
      vendor_id: `eq.${actor.vendorId}`,
      order: "created_at.desc",
    });

    const rows = await supabaseServiceFetch<ProductRow[]>(
      `/rest/v1/products?${params.toString()}`,
    );

    return apiOk({
      ok: true,
      needsOnboarding: !actor.profile.vendor_profile_complete,
      products: rows.map(mapProduct),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_PRODUCTS_GET_API_ERROR", error);
    return apiError("Unable to load vendor products.", 503);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiError("Complete vendor onboarding before managing products.", 400);
    }

    const vendor = await getVendor(actor.vendorId);
    if (!vendor) return apiError("Vendor profile not found.", 404);

    const body = await request.json();
    const payload = buildProductPayload(body, vendor);

    const rows = await supabaseServiceFetch<ProductRow[]>("/rest/v1/products", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    const product = rows[0];
    await Promise.all([
      replaceImages(product.id, body.images),
      replaceTags(product.id, body.sustainabilityTagIds),
    ]);

    const refreshedParams = new URLSearchParams({
      select: PRODUCT_SELECT,
      id: `eq.${product.id}`,
      limit: "1",
    });
    const refreshed = await supabaseServiceFetch<ProductRow[]>(
      `/rest/v1/products?${refreshedParams.toString()}`,
    );

    return apiOk({ ok: true, product: mapProduct(refreshed[0] || product) }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && error.message === "Listing title is required.") {
      return apiError(error.message, 400);
    }
    console.error("VENDOR_PRODUCTS_POST_API_ERROR", error);
    return apiError("Unable to create product listing.", 503);
  }
}
