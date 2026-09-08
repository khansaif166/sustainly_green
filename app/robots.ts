import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      // "/" already permits everything not explicitly disallowed below, so the
      // catalogue paths don't need restating.
      allow: "/",
      disallow: [
        "/api/",

        // Authenticated areas. Prefix matching covers the nested routes, so
        // "/admin" alone also blocks "/admin/products/new".
        "/admin",
        "/buyer",
        "/vendor",

        // Auth flows. The public supplier directory lives at /find-vendors,
        // so blocking "/vendor" above does not affect it.
        "/login",
        "/register",
        "/reset-password",
        "/check-email",
        "/verify-email",

        // Internal search results: infinite, thin, and duplicative of /browse.
        // Category facets are deliberately NOT blocked — categorySitemapEntries()
        // publishes /browse?category=... in sitemap-categories.xml.
        "/*?q=",
        "/*?*&q=",

        // ContactVendorModal deep-link. Same page as the bare product URL,
        // just with the modal open.
        "/*?contact=",
        "/*?*&contact=",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
