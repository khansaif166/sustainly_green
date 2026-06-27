import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildCareerPatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = stringOrNull(body.title);
    if (!title) throw new Error("Job title is required.");
    patch.title = title;
  }

  if (body.department !== undefined) patch.department = stringOrNull(body.department);
  if (body.location !== undefined) patch.location = stringOrNull(body.location);
  if (body.description !== undefined) patch.description = stringOrNull(body.description);
  if (body.type !== undefined || body.employmentType !== undefined) {
    patch.employment_type =
      stringOrNull(body.type) || stringOrNull(body.employmentType);
  }
  if (body.active !== undefined) patch.active = Boolean(body.active);

  patch.updated_at = new Date().toISOString();
  return patch;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();
    const patch = buildCareerPatch(body);

    await supabaseServiceFetch<void>(
      `/rest/v1/careers?${new URLSearchParams({ id: `eq.${id}` })}`,
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
    if (error instanceof Error && error.message === "Job title is required.") {
      return apiError(error.message, 400);
    }
    console.error("ADMIN_CAREER_PATCH_API_ERROR", error);
    return apiError("Unable to update career.", 503);
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
      `/rest/v1/careers?${new URLSearchParams({ id: `eq.${id}` })}`,
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
    console.error("ADMIN_CAREER_DELETE_API_ERROR", error);
    return apiError("Unable to delete career.", 503);
  }
}
