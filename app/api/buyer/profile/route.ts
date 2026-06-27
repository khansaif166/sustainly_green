import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

type BuyerRow = {
  id: string;
  profile_id: string;
  company_info: Record<string, unknown>;
  business_overview: Record<string, unknown>;
  sustainability: Record<string, unknown>;
  procurement: Record<string, unknown>;
  segment_details: Record<string, unknown>;
  declaration: Record<string, unknown>;
  approved: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapBuyer(row: BuyerRow | null) {
  if (!row) return null;

  return {
    id: row.id,
    profileId: row.profile_id,
    companyInfo: row.company_info || {},
    businessOverview: row.business_overview || {},
    sustainability: row.sustainability || {},
    procurement: row.procurement || {},
    segmentDetails: row.segment_details || {},
    declaration: row.declaration || {},
    approved: Boolean(row.approved),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function fetchBuyer(profileId: string) {
  const params = new URLSearchParams({
    select: "*",
    profile_id: `eq.${profileId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<BuyerRow[]>(
    `/rest/v1/buyers?${params.toString()}`,
  );

  return rows[0] || null;
}

export async function GET(request: Request) {
  try {
    const actor = await requireRole(request, ["BUYER", "ADMIN"]);
    const buyer = await fetchBuyer(actor.profile.id);

    return apiOk({
      ok: true,
      profile: actor.profile,
      buyer: mapBuyer(buyer),
      profileComplete: actor.profile.buyer_profile_complete,
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);

    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);

    console.error("BUYER_PROFILE_GET_API_ERROR", error);
    return apiError("Unable to load buyer profile.", 503);
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireRole(request, ["BUYER", "ADMIN"]);
    const body = await request.json();
    const status = body.status === "submitted" ? "submitted" : "draft";
    const profileComplete = status === "submitted";
    const companyInfo = objectValue(body.companyInfo);

    const payload = {
      profile_id: actor.profile.id,
      company_info: companyInfo,
      business_overview: objectValue(body.businessOverview),
      sustainability: objectValue(body.sustainability),
      procurement: objectValue(body.procurement),
      segment_details: objectValue(body.segmentDetails),
      declaration: objectValue(body.declaration),
      status,
    };

    const rows = await supabaseServiceFetch<BuyerRow[]>(
      "/rest/v1/buyers?on_conflict=profile_id",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      },
    );

    const profilePatch: Record<string, unknown> = {
      buyer_profile_complete: profileComplete,
      company_name:
        typeof companyInfo.companyName === "string"
          ? companyInfo.companyName
          : actor.profile.name,
    };

    const profileParams = new URLSearchParams({
      id: `eq.${actor.profile.id}`,
    });

    await supabaseServiceFetch<void>(
      `/rest/v1/profiles?${profileParams.toString()}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal",
        },
        body: JSON.stringify(profilePatch),
      },
    );

    return apiOk({
      ok: true,
      profileComplete,
      buyer: mapBuyer(rows[0]),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);

    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);

    console.error("BUYER_PROFILE_PUT_API_ERROR", error);
    return apiError("Unable to save buyer profile.", 503);
  }
}
