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


async function loadOwnedProduct(id: string, vendorId: string) {
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    id: `eq.${id}`,
    vendor_id: `eq.${vendorId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<ProductRow[]>(
    `/rest/v1/products?${params.toString()}`,
  );

  return rows[0] || null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiError("Complete vendor onboarding before managing products.", 400);
    }

    const { id } = await context.params;
    const product = await loadOwnedProduct(id, actor.vendorId);

    if (!product) {
      return apiError("Product listing not found.", 404);
    }

    return apiOk({ ok: true, product: mapProduct(product) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_PRODUCT_GET_API_ERROR", error);
    return apiError("Unable to load product listing.", 503);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiError("Complete vendor onboarding before managing products.", 400);
    }

    const { id } = await context.params;
    const existing = await loadOwnedProduct(id, actor.vendorId);

    if (!existing) {
      return apiError("Product listing not found.", 404);
    }

    const vendor = await getVendor(actor.vendorId);
    if (!vendor) return apiError("Vendor profile not found.", 404);

    const body = await request.json();
    const payload = buildProductPayload(body, vendor);

    await supabaseServiceFetch<void>(
      `/rest/v1/products?${new URLSearchParams({ id: `eq.${id}`, vendor_id: `eq.${actor.vendorId}` })}`,
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

    const refreshed = await loadOwnedProduct(id, actor.vendorId);
    if (!refreshed) return apiError("Product listing not found after update.", 404);

    return apiOk({ ok: true, product: mapProduct(refreshed) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && error.message === "Listing title is required.") {
      return apiError(error.message, 400);
    }
    console.error("VENDOR_PRODUCT_PUT_API_ERROR", error);
    return apiError("Unable to update product listing.", 503);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiError("Complete vendor onboarding before managing products.", 400);
    }

    const { id } = await context.params;
    const existing = await loadOwnedProduct(id, actor.vendorId);

    if (!existing) {
      return apiError("Product listing not found.", 404);
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/products?${new URLSearchParams({ id: `eq.${id}`, vendor_id: `eq.${actor.vendorId}` })}`,
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
    console.error("VENDOR_PRODUCT_DELETE_API_ERROR", error);
    return apiError("Unable to delete product listing.", 503);
  }
}
