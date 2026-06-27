import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer"; 

export const runtime = "edge";

const ALLOWED_AD_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.adStatus !== undefined) {
      const adStatus =
        typeof body.adStatus === "string" ? body.adStatus.trim().toUpperCase() : "";
      if (!ALLOWED_AD_STATUSES.has(adStatus)) {
        return apiError("Unsupported ad status.", 400);
      }
      patch.ad_status = adStatus;
      patch.ad_active = adStatus === "APPROVED";
      patch.ad_placement = "HOME_HERO";
    }

    if (body.adActive !== undefined) patch.ad_active = Boolean(body.adActive);

    if (body.remove === true) {
      patch.is_ad = false;
      patch.ad_status = "REJECTED";
      patch.ad_active = false;
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/products?${new URLSearchParams({ id: `eq.${id}` })}`,
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
    console.error("ADMIN_AD_PATCH_API_ERROR", error);
    return apiError("Unable to update ad.", 503);
  }
}
