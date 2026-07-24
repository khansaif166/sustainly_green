import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type AdminOverview = {
  counts: {
    users: number;
    vendors: number;
    pendingVendors: number;
    approvedVendors: number;
    products: number;
    pendingProducts: number;
    approvedProducts: number;
    rfqs: number;
  };
  productsByCategory: Array<{ name: string; value: number }>;
  recentRFQs: Array<Record<string, unknown>>;
  recentProducts: Array<Record<string, unknown>>;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const overview = await supabaseServiceFetch<AdminOverview>(
      "/rest/v1/rpc/admin_overview",
      {
        method: "POST",
        body: "{}",
      },
    );

    return apiOk({
      ok: true,
      ...overview,
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_OVERVIEW_API_ERROR", error);
    return apiError("Unable to load admin overview.", 503);
  }
}
