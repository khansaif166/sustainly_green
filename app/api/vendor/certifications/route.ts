import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

type CertificationRequestRow = {
  id: string;
  certification_name: string | null;
  status: string;
  message: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiOk({ ok: true, certifications: [] });
    }

    const params = new URLSearchParams({
      select: "id,certification_name,status,message,created_at",
      vendor_id: `eq.${actor.vendorId}`,
      order: "created_at.desc",
    });

    const rows = await supabaseServiceFetch<CertificationRequestRow[]>(
      `/rest/v1/certification_requests?${params.toString()}`,
    );

    return apiOk({
      ok: true,
      certifications: rows.map((row) => ({
        id: row.id,
        certificationType: row.certification_name || "Certification request",
        status: row.status,
        message: row.message || "",
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_CERTIFICATIONS_API_ERROR", error);
    return apiError("Unable to load vendor certifications.", 503);
  }
}
