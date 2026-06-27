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
  company_name: string | null;
  email: string | null;
  phone: string | null;
  certification_name: string | null;
  message: string | null;
  status: string;
  raw_firebase: Record<string, unknown>;
  created_at: string;
};

function mapRequest(row: CertificationRequestRow) {
  const raw = row.raw_firebase || {};

  return {
    id: row.id,
    companyName: row.company_name || raw.companyName || "",
    contactPerson: raw.contactPerson || raw.name || "",
    designation: raw.designation || "",
    email: row.email || raw.email || "",
    phone: row.phone || raw.phone || raw.mobile || "",
    certificationName:
      row.certification_name || raw.certificationName || raw.primarySustainabilityCert || "",
    employees: raw.employees || "",
    locations: raw.locations || "",
    businessScope: raw.businessScope || "",
    timeline: raw.timeline || "",
    previousCertification: raw.previousCertification || "",
    message: row.message || raw.message || "",
    status: row.status || "NEW",
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<CertificationRequestRow[]>(
      `/rest/v1/certification_requests?${new URLSearchParams({
        select: "id,company_name,email,phone,certification_name,message,status,raw_firebase,created_at",
        order: "created_at.desc",
        limit: "10000",
      })}`,
    );

    return apiOk({ ok: true, requests: rows.map(mapRequest) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_CERT_REQUESTS_GET_API_ERROR", error);
    return apiError("Unable to load certification requests.", 503);
  }
}
