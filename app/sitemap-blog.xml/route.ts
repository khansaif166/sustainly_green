import {
  blogSitemapEntries,
  urlSet,
  xmlResponse,
} from "@/lib/seoSitemaps";

export const revalidate = 3600;

export async function GET() {
  return xmlResponse(urlSet(await blogSitemapEntries()));
}
