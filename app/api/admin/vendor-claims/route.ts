import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

const STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

type ClaimRow = {
  id: string;
  status: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_designation: string | null;
  company_email: string | null;
  company_website: string | null;
  message: string | null;
  raw_payload: { proof_type?: string | null; proof_details?: string | null } | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  vendor: {
    id: string;
    company_name: string;
    city: string | null;
    state: string | null;
    claim_status: string | null;
    profile_id: string | null;
  } | null;
  claimant: { id: string; email: string; name: string; role: string } | null;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const status = new URL(request.url).searchParams.get("status")?.toUpperCase() || "PENDING";
    const params = new URLSearchParams({
      // Two FKs point at profiles (profile_id, reviewed_by_profile_id), so
      // the claimant embed names its constraint explicitly.
      select:
        "id,status,requester_name,requester_email,requester_phone,requester_designation," +
        "company_email,company_website,message,raw_payload,review_notes,reviewed_at,created_at," +
        "vendor:vendors!vendor_claims_vendor_id_fkey(id,company_name,city,state,claim_status,profile_id)," +
        "claimant:profiles!vendor_claims_profile_id_fkey(id,email,name,role)",
      order: "created_at.desc",
      limit: "500",
    });
    if (status !== "ALL" && STATUSES.has(status)) params.set("status", `eq.${status}`);

    const rows = await supabaseServiceFetch<ClaimRow[]>(`/rest/v1/vendor_claims?${params}`);

    return apiOk({
      ok: true,
      claims: rows.map((row) => ({
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at,
        reviewNotes: row.review_notes || "",
        requester: {
          name: row.requester_name,
          email: row.requester_email,
          phone: row.requester_phone || "",
          designation: row.requester_designation || "",
        },
        companyEmail: row.company_email || "",
        companyWebsite: row.company_website || "",
        message: row.message || "",
        proofType: row.raw_payload?.proof_type || "",
        proofDetails: row.raw_payload?.proof_details || "",
        vendor: row.vendor && {
          id: row.vendor.id,
          companyName: row.vendor.company_name,
          location: [row.vendor.city, row.vendor.state].filter(Boolean).join(", "),
          claimStatus: row.vendor.claim_status || "",
          owned: Boolean(row.vendor.profile_id),
        },
        claimant: row.claimant && {
          id: row.claimant.id,
          email: row.claimant.email,
          name: row.claimant.name,
          role: row.claimant.role,
        },
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDOR_CLAIMS_GET_API_ERROR", error);
    return apiError("Unable to load vendor claims.", 503);
  }
}
