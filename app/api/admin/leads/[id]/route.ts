import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


const ALLOWED_STATUSES = ["OPEN", "ACCEPTED", "REJECTED", "RFQ_REQUESTED"] as const;
type AllowedStatus = typeof ALLOWED_STATUSES[number];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);

    const { id } = await context.params;
    const body = await request.json();
    const status: string = body.status;

    if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
      return apiError(`Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`, 400);
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/rfqs?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status }),
      },
    );

    return apiOk({ ok: true, id, status });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_LEAD_PATCH_ERROR", error);
    return apiError("Unable to update RFQ status.", 503);
  }
}
