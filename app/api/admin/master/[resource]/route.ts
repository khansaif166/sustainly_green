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
  const name = stringOrNull(body.name);
  if (!name) throw new Error("Name is required.");

  if (resource === "categories") {
    return {
      name,
      slug: stringOrNull(body.slug) || slugify(name),
      image_url: stringOrNull(body.imageUrl),
      active: body.active !== false,
    };
  }

  if (resource === "subcategories") {
    const categoryId = stringOrNull(body.categoryId);
    if (!categoryId) throw new Error("Category is required.");
    return {
      name,
      category_id: categoryId,
      active: body.active !== false,
    };
  }

  if (resource === "product-types") {
    if (name.length > 120) throw new Error("Product type name must be 120 characters or fewer.");
    const subcategoryId = stringOrNull(body.subcategoryId);
    if (!subcategoryId) throw new Error("Subcategory is required.");
    return { name, subcategory_id: subcategoryId, active: body.active !== false };
  }

  return {
    name,
    active: body.active !== false,
  };
}

function mapRow(resource: string, row: Record<string, any>) {
  if (resource === "categories") {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.image_url || "",
      active: Boolean(row.active),
    };
  }

  if (resource === "subcategories") {
    return {
      id: row.id,
      name: row.name,
      categoryId: row.category_id,
      active: Boolean(row.active),
    };
  }

  if (resource === "product-types") {
    return { id: row.id, name: row.name, subcategoryId: row.subcategory_id, active: Boolean(row.active) };
  }

  return {
    id: row.id,
    name: row.name,
    active: Boolean(row.active),
  };
}

function selectFor(resource: string) {
  if (resource === "categories") return "id,name,slug,image_url,active";
  if (resource === "subcategories") return "id,name,category_id,active";
  if (resource === "product-types") return "id,name,subcategory_id,active";
  return "id,name,active";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { resource } = await context.params;
    const table = getTable(resource);
    if (!table) return apiError("Unsupported master resource.", 404);

    const rows = await supabaseServiceFetch<Array<Record<string, any>>>(
      `/rest/v1/${table}?${new URLSearchParams({ select: selectFor(resource), order: "name.asc", limit: "10000" })}`,
    );

    return apiOk({ ok: true, items: rows.map((row) => mapRow(resource, row)) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_MASTER_GET_API_ERROR", error);
    return apiError("Unable to load master data.", 503);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { resource } = await context.params;
    const table = getTable(resource);
    if (!table) return apiError("Unsupported master resource.", 404);

    const body = await request.json();
    const payload = buildPayload(resource, body);

    await supabaseServiceFetch<void>(`/rest/v1/${table}`, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });

    if (resource !== "tags") { revalidatePath("/browse"); revalidatePath("/products/[productId]/[productSlug]", "page"); }

    return apiOk({ ok: true }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && ["Name is required.", "Category is required.", "Subcategory is required.", "Product type name must be 120 characters or fewer."].includes(error.message)) {
      return apiError(error.message, 400);
    }
    if (error instanceof SupabaseHttpError && error.code === "23505") return apiError("This name is already in use under the selected parent.", 409);
    if (error instanceof SupabaseHttpError && ["23503", "23514", "22P02"].includes(error.code || "")) return apiError("Choose a valid catalog parent.", 400);
    console.error("ADMIN_MASTER_POST_API_ERROR", error);
    return apiError("Unable to save master data.", 503);
  }
}
