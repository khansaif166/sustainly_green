import { apiError, apiOk } from "@/lib/apiResponse";
import { revalidatePath } from "next/cache";
import {
  requireRole,
  supabaseServiceFetch,
  SupabaseHttpError,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


const RESOURCE_TABLE = {
  categories: "categories",
  subcategories: "subcategories",
  "product-types": "product_types",
  tags: "sustainability_tags",
} as const;

function getTable(resource: string) {
  return RESOURCE_TABLE[resource as keyof typeof RESOURCE_TABLE] || null;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildPayload(resource: string, body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = stringOrNull(body.name);
    if (!name) throw new Error("Name is required.");
    if (resource === "product-types" && name.length > 120) throw new Error("Product type name must be 120 characters or fewer.");
    payload.name = name;
    if (resource === "categories") payload.slug = stringOrNull(body.slug) || slugify(name);
  }

  if (resource === "categories" && body.imageUrl !== undefined) {
    payload.image_url = stringOrNull(body.imageUrl);
  }

  if (resource === "subcategories" && body.categoryId !== undefined) {
    const categoryId = stringOrNull(body.categoryId);
    if (!categoryId) throw new Error("Category is required.");
    payload.category_id = categoryId;
  }

  if (resource === "product-types" && body.subcategoryId !== undefined) {
    const subcategoryId = stringOrNull(body.subcategoryId);
    if (!subcategoryId) throw new Error("Subcategory is required.");
    payload.subcategory_id = subcategoryId;
  }

  if (body.active !== undefined) payload.active = Boolean(body.active);

  return payload;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { resource, id } = await context.params;
    const table = getTable(resource);
    if (!table) return apiError("Unsupported master resource.", 404);

    const body = await request.json();
    const payload = buildPayload(resource, body);

    if (!Object.keys(payload).length) {
      return apiError("No update was provided.", 400);
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/${table}?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      },
    );

    if (resource !== "tags") { revalidatePath("/browse"); revalidatePath("/products/[productId]/[productSlug]", "page"); }

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && ["Name is required.", "Category is required.", "Subcategory is required.", "Product type name must be 120 characters or fewer."].includes(error.message)) {
      return apiError(error.message, 400);
    }
    if (error instanceof SupabaseHttpError && error.code === "23505") return apiError("This name is already in use under the selected parent.", 409);
    if (error instanceof SupabaseHttpError && ["23503", "23514", "22P02"].includes(error.code || "")) return apiError("This catalog parent cannot be changed while products use it, or the selected parent is invalid.", 400);
    console.error("ADMIN_MASTER_PATCH_API_ERROR", error);
    return apiError("Unable to update master data.", 503);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { resource, id } = await context.params;
    const table = getTable(resource);
    if (!table) return apiError("Unsupported master resource.", 404);

    await supabaseServiceFetch<void>(
      `/rest/v1/${table}?${new URLSearchParams({ id: `eq.${id}` })}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );

    if (resource !== "tags") { revalidatePath("/browse"); revalidatePath("/products/[productId]/[productSlug]", "page"); }

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof SupabaseHttpError && (error.code === "23503" || error.code === "23001")) {
      return apiError("This item is used by products or child catalog items and cannot be deleted.", 409);
    }
    console.error("ADMIN_MASTER_DELETE_API_ERROR", error);
    return apiError("Unable to delete master data.", 503);
  }
}
