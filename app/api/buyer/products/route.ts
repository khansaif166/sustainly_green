import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

type ProductRow = {
  id: string;
  vendor_id: string;
  vendor_name: string;
  title: string;
  description: string | null;
  category_id: string | null;
  price: number | string | null;
  currency: string;
  moq: number | string | null;
  in_stock: boolean;
  product_images: Array<{ url: string | null; sort_order: number | null }> | null;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, ["BUYER", "ADMIN"]);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";

    const params = new URLSearchParams({
      select: "id,vendor_id,vendor_name,title,description,category_id,price,currency,moq,in_stock,product_images(url,sort_order)",
      approved: "eq.true",
      in_stock: "eq.true",
      order: "created_at.desc",
      limit: "200",
    });

    const rows = await supabaseServiceFetch<ProductRow[]>(
      `/rest/v1/products?${params.toString()}`,
    );

    const filtered = search
      ? rows.filter(r =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.vendor_name.toLowerCase().includes(search.toLowerCase()),
        )
      : rows;

    return apiOk({
      ok: true,
      products: filtered.map(r => ({
        id: r.id,
        vendorId: r.vendor_id,
        vendorName: r.vendor_name,
        title: r.title,
        description: r.description || "",
        categoryId: r.category_id || "",
        price: r.price ?? null,
        currency: r.currency || "INR",
        moq: r.moq ?? null,
        inStock: r.in_stock,
        imageUrl:
          r.product_images
            ?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            ?.find(img => img.url)?.url || null,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("BUYER_PRODUCTS_GET_API_ERROR", error);
    return apiError("Unable to load products.", 503);
  }
}
