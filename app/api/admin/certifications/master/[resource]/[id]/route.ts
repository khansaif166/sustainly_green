import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


const RESOURCE_TABLE = {
  certifications: "certifications",
  bodies: "certifying_bodies",
} as const;

function getTable(resource: string) {
  return RESOURCE_TABLE[resource as keyof typeof RESOURCE_TABLE] || null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildPatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) {
    const name = stringOrNull(body.name);
    if (!name) throw new Error("Name is required.");
    patch.name = name;
  }

  if (body.description !== undefined) patch.description = stringOrNull(body.description);
  if (body.country !== undefined) patch.country = stringOrNull(body.country);
  if (body.status !== undefined) patch.status = stringOrNull(body.status) || "Active";

  return patch;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { resource, id } = await context.params;
    const table = getTable(resource);
    if (!table) return apiError("Unsupported certification master resource.", 404);

    const body = await request.json();
    const patch = buildPatch(body);

    await supabaseServiceFetch<void>(
      `/rest/v1/${table}?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && error.message === "Name is required.") {
      return apiError(error.message, 400);
    }
    console.error("ADMIN_CERT_MASTER_PATCH_API_ERROR", error);
    return apiError("Unable to update certification master data.", 503);
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
    if (!table) return apiError("Unsupported certification master resource.", 404);

    await supabaseServiceFetch<void>(
      `/rest/v1/${table}?${new URLSearchParams({ id: `eq.${id}` })}`,
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
    console.error("ADMIN_CERT_MASTER_DELETE_API_ERROR", error);
    return apiError("Unable to delete certification master data.", 503);
  }
}
