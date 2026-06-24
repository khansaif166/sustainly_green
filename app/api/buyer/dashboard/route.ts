import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

type RfqRow = {
  id: string;
  requirement_title: string;
  status: string;
  estimated_quantity: string | null;
  required_timeline: string | null;
  delivery_country: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    const actor = await requireRole(request, ["BUYER", "ADMIN"]);

    if (!actor.buyerId) {
      return apiOk({
        ok: true,
        needsOnboarding: true,
        rfqs: [],
      });
    }

    const params = new URLSearchParams({
      select:
        "id,requirement_title,status,estimated_quantity,required_timeline,delivery_country,created_at",
      buyer_id: `eq.${actor.buyerId}`,
      order: "created_at.asc",
    });

    const rows = await supabaseServiceFetch<RfqRow[]>(
      `/rest/v1/rfqs?${params.toString()}`,
    );

    return apiOk({
      ok: true,
      needsOnboarding: !actor.profile.buyer_profile_complete,
      rfqs: rows.map((row) => ({
        id: row.id,
        requirementTitle: row.requirement_title,
        status: row.status,
        estimatedQuantity: row.estimated_quantity || "",
        requiredTimeline: row.required_timeline || "",
        deliveryCountry: row.delivery_country || "",
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);

    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const configError = toConfigError(error);

    if (configError) {
      return apiError(configError.message, configError.status);
    }

    console.error("BUYER_DASHBOARD_API_ERROR", error);
    return apiError("Unable to load buyer dashboard.", 503);
  }
}
