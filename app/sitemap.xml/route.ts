import { sitemapIndex, xmlResponse } from "@/lib/seoSitemaps";

export const revalidate = 3600;

export function GET() {
  return xmlResponse(
    sitemapIndex([
      "sitemap-products.xml",
      "sitemap-vendors.xml",
      "sitemap-categories.xml",
      "sitemap-blog.xml",
      "sitemap-static.xml",
    ]),
  );
}
