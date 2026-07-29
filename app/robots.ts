import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/products/",
        "/find-vendors/",
        "/categories",
        "/browse",
        "/blogs/",
      ],
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/buyer",
        "/buyer/",
        "/vendor",
        "/vendor/",
        "/login",
        "/register",
        "/reset-password",
        "/check-email",
        "/verify-email",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
