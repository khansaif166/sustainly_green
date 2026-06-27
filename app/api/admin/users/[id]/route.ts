import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

const VALID_ROLES = new Set(["ADMIN", "BUYER", "VENDOR"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    if (id === actor.profile.id) {
      return apiError("Admins cannot modify their own account.", 403);
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!VALID_ROLES.has(body.role)) {
        return apiError("Invalid role value.", 400);
      }
      patch.role = body.role;
    }
    if (body.blocked !== undefined) patch.disabled = Boolean(body.blocked);

    if (!Object.keys(patch).length) {
      return apiError("No user update was provided.", 400);
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${id}` })}`,
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
    console.error("ADMIN_USER_PATCH_API_ERROR", error);
    return apiError("Unable to update user.", 503);
  }
}
