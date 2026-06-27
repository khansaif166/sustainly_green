import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type AdProductRow = {
  id: string;
  title: string;
  vendor_id: string;
  is_ad: boolean;
  ad_status: "PENDING" | "APPROVED" | "REJECTED" | null;
  ad_active: boolean;
  impressions: number | null;
  clicks: number | null;
  budget: number | null;
  product_images?: Array<{ url: string; sort_order: number | null }>;
};

function mapAd(row: AdProductRow) {
  const images = (row.product_images || [])
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((image) => image.url);

  return {
    id: row.id,
    title: row.title,
    vendorId: row.vendor_id,
    images,
    isAd: Boolean(row.is_ad),
    adStatus: row.ad_status || "PENDING",
    adActive: Boolean(row.ad_active),
    impressions: row.impressions || 0,
    clicks: row.clicks || 0,
    budget: row.budget || 0,
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<AdProductRow[]>(
      `/rest/v1/products?${new URLSearchParams({
        select:
          "id,title,vendor_id,is_ad,ad_status,ad_active,impressions,clicks,budget,product_images(url,sort_order)",
        is_ad: "eq.true",
        order: "created_at.desc",
        limit: "10000",
      })}`,
    );

    return apiOk({ ok: true, ads: rows.map(mapAd) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_ADS_GET_API_ERROR", error);
    return apiError("Unable to load ads.", 503);
  }
}
