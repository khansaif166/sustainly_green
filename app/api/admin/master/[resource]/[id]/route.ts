import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


const RESOURCE_TABLE = {
  categories: "categories",
  subcategories: "subcategories",
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

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && ["Name is required.", "Category is required."].includes(error.message)) {
      return apiError(error.message, 400);
    }
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

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_MASTER_DELETE_API_ERROR", error);
    return apiError("Unable to delete master data.", 503);
  }
}
