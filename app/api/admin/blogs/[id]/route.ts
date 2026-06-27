import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

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

function buildBlogPatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = stringOrNull(body.title);
    if (!title) throw new Error("Blog title is required.");
    patch.title = title;
    patch.slug = stringOrNull(body.slug) || slugify(title);
  }

  if (body.content !== undefined) {
    const content = stringOrNull(body.content);
    if (!content) throw new Error("Blog content is required.");
    patch.content = content;
    patch.excerpt = stringOrNull(body.excerpt) || stripHtml(content).slice(0, 180);
  }

  if (body.imageUrl !== undefined || body.image !== undefined) {
    patch.image_url = stringOrNull(body.imageUrl) || stringOrNull(body.image);
  }

  if (body.published !== undefined) patch.published = Boolean(body.published);

  patch.updated_at = new Date().toISOString();
  return patch;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();
    const patch = buildBlogPatch(body);

    await supabaseServiceFetch<void>(
      `/rest/v1/blogs?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      },
    );

    return apiOk({ ok: true });
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
    console.error("ADMIN_BLOG_PATCH_API_ERROR", error);
    return apiError("Unable to update blog.", 503);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    await supabaseServiceFetch<void>(
      `/rest/v1/blogs?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_BLOG_DELETE_API_ERROR", error);
    return apiError("Unable to delete blog.", 503);
  }
}
