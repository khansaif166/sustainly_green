import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

type CareerRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
};

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildCareerPayload(body: Record<string, unknown>) {
  const title = stringOrNull(body.title);
  if (!title) throw new Error("Job title is required.");

  return {
    title,
    department: stringOrNull(body.department),
    location: stringOrNull(body.location),
    employment_type: stringOrNull(body.type) || stringOrNull(body.employmentType),
    description: stringOrNull(body.description),
    active: body.active !== false,
  };
}

function mapCareer(row: CareerRow) {
  return {
    id: row.id,
    title: row.title,
    department: row.department || "",
    location: row.location || "",
    type: row.employment_type || "FULL_TIME",
    description: row.description || "",
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<CareerRow[]>(
      `/rest/v1/careers?${new URLSearchParams({
        select: "id,title,department,location,employment_type,description,active,created_at",
        order: "created_at.desc",
        limit: "10000",
      })}`,
    );

    return apiOk({ ok: true, jobs: rows.map(mapCareer) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_CAREERS_GET_API_ERROR", error);
    return apiError("Unable to load careers.", 503);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const body = await request.json();
    const payload = buildCareerPayload(body);

    await supabaseServiceFetch<void>("/rest/v1/careers", {
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
    if (error instanceof Error && error.message === "Job title is required.") {
      return apiError(error.message, 400);
    }
    console.error("ADMIN_CAREERS_POST_API_ERROR", error);
    return apiError("Unable to save career.", 503);
  }
}
