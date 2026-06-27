import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type RfqRow = {
  id: string;
  requirement_title: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  estimated_quantity: string | null;
  delivery_country: string | null;
  vendor_id: string | null;
  status: string;
  created_at: string;
};

function mapLead(row: RfqRow) {
  return {
    id: row.id,
    type: "DIRECT",
    name: row.buyer_name,
    email: row.buyer_email,
    phone: row.buyer_phone || "",
    title: row.requirement_title,
    quantity: row.estimated_quantity || "",
    country: row.delivery_country || "",
    vendorId: row.vendor_id || "",
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleDateString(),
    rawDate: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 15), 100);
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

    const params = new URLSearchParams({
      select:
        "id,requirement_title,buyer_name,buyer_email,buyer_phone,estimated_quantity,delivery_country,vendor_id,status,created_at",
      order: "created_at.desc",
      limit: String(limit),
      offset: String(offset),
    });

    const rows = await supabaseServiceFetch<RfqRow[]>(
      `/rest/v1/rfqs?${params.toString()}`,
    );

    return apiOk({
      ok: true,
      leads: rows.map(mapLead),
      hasMore: rows.length === limit,
      nextOffset: offset + rows.length,
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_LEADS_API_ERROR", error);
    return apiError("Unable to load admin leads.", 503);
  }
}
