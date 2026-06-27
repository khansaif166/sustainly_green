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
  loadAdminProduct,
  loadAdminVendor,
  mapMastersForForms,
  mapProduct,
  refreshAdminProduct,
  replaceImages,
  replaceTags,
} from "@/lib/adminProductsServer";

export const runtime = "edge";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const [product, masters] = await Promise.all([
      loadAdminProduct(id),
      getAdminProductMasters(),
    ]);

    if (!product) return apiError("Product not found.", 404);

    return apiOk({
      ok: true,
      product: mapProduct(product),
      masters: mapMastersForForms(masters),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_PRODUCT_GET_API_ERROR", error);
    return apiError("Unable to load product.", 503);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();

    const patch: Record<string, unknown> = {};

    if (body.status) {
      patch.status = body.status;
      patch.approved = body.status === "APPROVED";
    }

    if (body.featured !== undefined) patch.featured = Boolean(body.featured);
    if (body.isAd !== undefined) patch.is_ad = Boolean(body.isAd);
    if (body.adActive !== undefined) patch.ad_active = Boolean(body.adActive);

    if (!Object.keys(patch).length) {
      return apiError("No product update was provided.", 400);
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/products?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      },
    );

    const product = await refreshAdminProduct(id);
    return apiOk({ ok: true, product });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_PRODUCT_PATCH_API_ERROR", error);
    return apiError("Unable to update product.", 503);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();
    const vendorId = typeof body.vendorId === "string" ? body.vendorId : "";

    if (!vendorId) return apiError("Please select a vendor.", 400);

    const existing = await loadAdminProduct(id);
    if (!existing) return apiError("Product not found.", 404);

    const vendor = await loadAdminVendor(vendorId);
    if (!vendor) return apiError("Vendor not found.", 404);

    const payload = buildAdminProductPayload(
      {
        ...body,
        status: body.status || existing.status,
        approved: body.approved ?? existing.approved,
      },
      vendor,
    );

    await supabaseServiceFetch<void>(
      `/rest/v1/products?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      },
    );

    await Promise.all([
      replaceImages(id, body.images),
      replaceTags(id, body.sustainabilityTagIds),
    ]);

    const product = await refreshAdminProduct(id);
    return apiOk({ ok: true, product });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && error.message === "Listing title is required.") {
      return apiError(error.message, 400);
    }
    console.error("ADMIN_PRODUCT_PUT_API_ERROR", error);
    return apiError("Unable to save product.", 503);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    await supabaseServiceFetch<void>(
      `/rest/v1/products?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_PRODUCT_DELETE_API_ERROR", error);
    return apiError("Unable to delete product.", 503);
  }
}
