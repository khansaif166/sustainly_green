import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetchAll,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import { analyzeProductSeo, SEO_ISSUES, type SeoIssueCode } from "@/lib/productSeo";
import { productHref } from "@/lib/slug";

type SeoRow = {
  id: string;
  title: string | null;
  description: string | null;
  vendor_name: string | null;
  category_id: string | null;
  price: number | string | null;
  price_type: string | null;
  updated_at: string | null;
  product_images?: Array<{ url: string | null }>;
};

// Only live (approved) listings are audited: they're the pages Google crawls.
export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const params = new URLSearchParams({
      select: "id,title,description,vendor_name,category_id,price,price_type,updated_at,product_images(url)",
      // Same filter the public site and sitemap use to decide what's live.
      approved: "eq.true",
      order: "id.asc",
    });
    const rows = await supabaseServiceFetchAll<SeoRow>(`/rest/v1/products?${params.toString()}`);

    const reports = analyzeProductSeo(
      rows.map((row) => ({
        id: row.id,
        title: row.title || "Untitled Product",
        description: row.description,
        vendorName: row.vendor_name,
        categoryId: row.category_id,
        price: row.price,
        priceType: row.price_type,
        imageCount: (row.product_images || []).filter((image) => image.url).length,
        updatedAt: row.updated_at,
      })),
    ).sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));

    const issueCounts = Object.fromEntries(
      (Object.keys(SEO_ISSUES) as SeoIssueCode[]).map((code) => [
        code,
        reports.filter((report) => report.issues.includes(code)).length,
      ]),
    ) as Record<SeoIssueCode, number>;

    const total = reports.length;
    const averageScore = total
      ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / total)
      : 100;

    return apiOk({
      ok: true,
      summary: {
        total,
        averageScore,
        healthy: reports.filter((report) => report.score >= 80).length,
        needsWork: reports.filter((report) => report.score >= 50 && report.score < 80).length,
        poor: reports.filter((report) => report.score < 50).length,
        issueCounts,
      },
      products: reports.map((report) => ({
        ...report,
        publicUrl: productHref(report.id, report.title),
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_PRODUCTS_SEO_HEALTH_API_ERROR", error);
    return apiError("Unable to load SEO health.", 503);
  }
}
