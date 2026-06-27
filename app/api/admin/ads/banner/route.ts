import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type SiteSettingRow = {
  key: string;
  value: {
    imageUrl?: string;
    linkUrl?: string;
    active?: boolean;
  };
};

function mapBanner(row?: SiteSettingRow) {
  if (!row) return null;

  return {
    imageUrl: row.value?.imageUrl || "",
    linkUrl: row.value?.linkUrl || "/browse",
    active: row.value?.active !== false,
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<SiteSettingRow[]>(
      `/rest/v1/site_settings?${new URLSearchParams({
        select: "key,value",
        key: "eq.homepageBanner",
        limit: "1",
      })}`,
    );

    return apiOk({ ok: true, banner: mapBanner(rows[0]) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_AD_BANNER_GET_API_ERROR", error);
    return apiError("Unable to load homepage banner.", 503);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const body = await request.json();
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : "";
    const linkUrl =
      typeof body.linkUrl === "string" && body.linkUrl.trim()
        ? body.linkUrl.trim()
        : "/browse";

    if (!imageUrl) return apiError("Banner image URL is required.", 400);

    await supabaseServiceFetch<void>("/rest/v1/site_settings?on_conflict=key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        key: "homepageBanner",
        value: {
          imageUrl,
          linkUrl,
          active: body.active !== false,
        },
        updated_at: new Date().toISOString(),
      }),
    });

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_AD_BANNER_PUT_API_ERROR", error);
    return apiError("Unable to save homepage banner.", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const body = await request.json();

    const rows = await supabaseServiceFetch<SiteSettingRow[]>(
      `/rest/v1/site_settings?${new URLSearchParams({
        select: "key,value",
        key: "eq.homepageBanner",
        limit: "1",
      })}`,
    );
    const existing = rows[0]?.value || {};

    await supabaseServiceFetch<void>(
      `/rest/v1/site_settings?${new URLSearchParams({ key: "eq.homepageBanner" })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          value: {
            ...existing,
            active: body.active !== false,
          },
          updated_at: new Date().toISOString(),
        }),
      },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_AD_BANNER_PATCH_API_ERROR", error);
    return apiError("Unable to update homepage banner.", 503);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    await supabaseServiceFetch<void>(
      `/rest/v1/site_settings?${new URLSearchParams({ key: "eq.homepageBanner" })}`,
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
    console.error("ADMIN_AD_BANNER_DELETE_API_ERROR", error);
    return apiError("Unable to delete homepage banner.", 503);
  }
}
