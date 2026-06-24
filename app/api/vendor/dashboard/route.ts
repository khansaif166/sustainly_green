import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import {
  mapVendorRfq,
  VENDOR_RFQ_SELECT,
  type VendorRfqRow,
} from "@/lib/vendorRfqsServer";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiOk({
        ok: true,
        needsOnboarding: true,
        rfqs: [],
      });
    }

    const params = new URLSearchParams({
      select: VENDOR_RFQ_SELECT,
      vendor_id: `eq.${actor.vendorId}`,
      order: "created_at.asc",
      limit: "25",
    });

    const rows = await supabaseServiceFetch<VendorRfqRow[]>(
      `/rest/v1/rfqs?${params.toString()}`,
    );

    return apiOk({
      ok: true,
      needsOnboarding: !actor.profile.vendor_profile_complete,
      rfqs: rows.map(mapVendorRfq),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_DASHBOARD_API_ERROR", error);
    return apiError("Unable to load vendor dashboard.", 503);
  }
}
