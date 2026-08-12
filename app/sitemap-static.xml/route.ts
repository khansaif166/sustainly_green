import { getSiteUrl } from "@/lib/site";
import { urlSet, xmlResponse } from "@/lib/seoSitemaps";

const routes = [
  "",
  "/browse",
  "/categories",
  "/find-vendors",
  "/blogs",
  "/about",
  "/certification",
  "/sdg-commitment",
  "/resources",
  "/careers",
  "/contact",
  "/help",
  "/help/buyers",
  "/help/vendors",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
] as const;

export function GET() {
  const siteUrl = getSiteUrl();
  return xmlResponse(urlSet(routes.map((route) => ({ url: `${siteUrl}${route}` }))));
}
