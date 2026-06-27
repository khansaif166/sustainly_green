import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type BuyerRow = {
  id: string;
  profile_id: string | null;
  company_info: Record<string, unknown>;
  business_overview: Record<string, unknown>;
  sustainability: Record<string, unknown>;
  procurement: Record<string, unknown>;
  approved: boolean;
  status: string;
  updated_at: string;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<BuyerRow[]>(
      "/rest/v1/buyers?select=id,profile_id,company_info,business_overview,sustainability,procurement,approved,status,updated_at&order=updated_at.desc&limit=10000",
    );

    return apiOk({
      ok: true,
      buyers: rows.map((row) => ({
        uid: row.id,
        id: row.id,
        profileId: row.profile_id,
        companyInfo: row.company_info || {},
        businessOverview: row.business_overview || {},
        sustainability: row.sustainability || {},
        procurement: row.procurement || {},
        approved: row.approved,
        status: row.status,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_BUYERS_GET_API_ERROR", error);
    return apiError("Unable to load buyers.", 503);
  }
}
