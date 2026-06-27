import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


export async function GET(request: Request) {
  try {
    await requireRole(request, ["VENDOR", "ADMIN"]);

    const [cats, subs, tags] = await Promise.all([
      supabaseServiceFetch<Array<{ id: string; name: string }>>(
        "/rest/v1/categories?select=id,name&active=eq.true&order=name.asc&limit=1000",
      ),
      supabaseServiceFetch<Array<{ id: string; name: string; category_id: string }>>(
        "/rest/v1/subcategories?select=id,name,category_id&active=eq.true&order=name.asc&limit=1000",
      ),
      supabaseServiceFetch<Array<{ id: string; name: string }>>(
        "/rest/v1/sustainability_tags?select=id,name&active=eq.true&order=name.asc&limit=1000",
      ),
    ]);

    return apiOk({
      ok: true,
      categories: cats,
      subcategories: subs.map((r) => ({ id: r.id, name: r.name, categoryId: r.category_id })),
      tags,
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_CATALOG_GET_ERROR", error);
    return apiError("Unable to load catalog data.", 503);
  }
}
