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

function buildPayload(body: Record<string, unknown>) {
  const name = stringOrNull(body.name);
  if (!name) throw new Error("Name is required.");

  return {
    name,
    description: stringOrNull(body.description),
    country: stringOrNull(body.country),
    status: stringOrNull(body.status) || "Active",
  };
}

function mapItem(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    country: row.country || "",
    status: row.status || "Active",
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { resource } = await context.params;
    const table = getTable(resource);
    if (!table) return apiError("Unsupported certification master resource.", 404);

    const rows = await supabaseServiceFetch<Array<Record<string, any>>>(
      `/rest/v1/${table}?${new URLSearchParams({
        select: "id,name,description,country,status",
        order: "name.asc",
        limit: "10000",
      })}`,
    );

    return apiOk({ ok: true, items: rows.map(mapItem) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_CERT_MASTER_GET_API_ERROR", error);
    return apiError("Unable to load certification master data.", 503);
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
    if (!table) return apiError("Unsupported certification master resource.", 404);

    const body = await request.json();
    const payload = buildPayload(body);

    await supabaseServiceFetch<void>(`/rest/v1/${table}`, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });

    return apiOk({ ok: true }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (error instanceof Error && error.message === "Name is required.") {
      return apiError(error.message, 400);
    }
    console.error("ADMIN_CERT_MASTER_POST_API_ERROR", error);
    return apiError("Unable to save certification master data.", 503);
  }
}
