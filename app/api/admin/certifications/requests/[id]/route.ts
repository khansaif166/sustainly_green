import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


const ALLOWED_STATUSES = new Set(["NEW", "IN_REVIEW", "APPROVED", "REJECTED"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();
    const status =
      typeof body.status === "string" ? body.status.trim().toUpperCase() : "";

    if (!ALLOWED_STATUSES.has(status)) {
      return apiError("Unsupported certification request status.", 400);
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/certification_requests?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status,
          updated_at: new Date().toISOString(),
        }),
      },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_CERT_REQUEST_PATCH_API_ERROR", error);
    return apiError("Unable to update certification request.", 503);
  }
}
