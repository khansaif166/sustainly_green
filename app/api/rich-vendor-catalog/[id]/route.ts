import { z } from "zod";
import { apiError, apiOk } from "@/lib/apiResponse";
import { isRichVendorActive, richApiError } from "@/lib/richVendorServer";
import { fetchApprovedProductsPage } from "@/lib/supabasePublic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const params = new URL(request.url).searchParams;
  const listingType = z.enum(["Product", "Service"]).safeParse(params.get("type"));
  const page = z.coerce.number().int().min(1).max(10_000_000).safeParse(params.get("page") || "1");
  if (!z.uuid().safeParse(id).success) return apiError("Vendor not found.", 404);
  if (!listingType.success || !page.success) return apiError("Invalid catalog page.", 400);
  try {
    if (!(await isRichVendorActive(id))) return apiError("Vendor profile not found.", 404);
    const data = await fetchApprovedProductsPage({ vendorId: id, listingType: listingType.data, page: page.data });
    return apiOk(data);
  } catch (error) {
    return richApiError(error);
  }
}
