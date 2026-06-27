import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

type BlogRow = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published: boolean;
  created_at: string;
};

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildBlogPayload(body: Record<string, unknown>) {
  const title = stringOrNull(body.title);
  if (!title) throw new Error("Blog title is required.");

  const content = stringOrNull(body.content);
  if (!content) throw new Error("Blog content is required.");

  return {
    title,
    slug: stringOrNull(body.slug) || slugify(title),
    excerpt: stringOrNull(body.excerpt) || stripHtml(content).slice(0, 180),
    content,
    image_url: stringOrNull(body.imageUrl) || stringOrNull(body.image),
    published: body.published !== false,
  };
}

function mapBlog(row: BlogRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    image: row.image_url || "",
    imageUrl: row.image_url || "",
    published: Boolean(row.published),
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "10000";
    const offset = url.searchParams.get("offset") || "0";

    const rows = await supabaseServiceFetch<BlogRow[]>(
      `/rest/v1/blogs?${new URLSearchParams({
        select: "id,title,slug,excerpt,content,image_url,published,created_at",
        order: "created_at.desc",
        limit,
        offset,
      })}`,
    );

    return apiOk({ ok: true, blogs: rows.map(mapBlog) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_BLOGS_GET_API_ERROR", error);
    return apiError("Unable to load blogs.", 503);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const body = await request.json();
    const payload = buildBlogPayload(body);

    await supabaseServiceFetch<void>("/rest/v1/blogs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });

    return apiOk({ ok: true }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    if (
      error instanceof Error &&
      ["Blog title is required.", "Blog content is required."].includes(error.message)
    ) {
      return apiError(error.message, 400);
    }
    console.error("ADMIN_BLOGS_POST_API_ERROR", error);
    return apiError("Unable to save blog.", 503);
  }
}
