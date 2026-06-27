import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


async function getBuyerProfileId(id: string) {
  const rows = await supabaseServiceFetch<Array<{ profile_id: string | null }>>(
    `/rest/v1/buyers?${new URLSearchParams({ select: "profile_id", id: `eq.${id}`, limit: "1" })}`,
  );
  return rows[0]?.profile_id || null;
}

type BuyerRow = {
  id: string;
  profile_id: string | null;
  company_info: Record<string, unknown>;
  business_overview: Record<string, unknown>;
  sustainability: Record<string, unknown>;
  procurement: Record<string, unknown>;
  segment_details: Record<string, unknown>;
  declaration: Record<string, unknown>;
  approved: boolean;
  status: string;
  updated_at: string;
};

function mapBuyer(row: BuyerRow) {
  return {
    uid: row.id,
    id: row.id,
    profileId: row.profile_id,
    companyInfo: row.company_info || {},
    businessOverview: row.business_overview || {},
    sustainability: row.sustainability || {},
    procurement: row.procurement || {},
    segmentDetails: row.segment_details || {},
    declaration: row.declaration || {},
    approved: row.approved,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function objectOrDefault(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    const rows = await supabaseServiceFetch<BuyerRow[]>(
      `/rest/v1/buyers?${new URLSearchParams({
        select:
          "id,profile_id,company_info,business_overview,sustainability,procurement,segment_details,declaration,approved,status,updated_at",
        id: `eq.${id}`,
        limit: "1",
      })}`,
    );

    const buyer = rows[0];
    if (!buyer) return apiError("Buyer not found.", 404);

    return apiOk({ ok: true, buyer: mapBuyer(buyer) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_BUYER_GET_API_ERROR", error);
    return apiError("Unable to load buyer.", 503);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.companyInfo !== undefined) patch.company_info = objectOrDefault(body.companyInfo);
    if (body.businessOverview !== undefined) {
      patch.business_overview = objectOrDefault(body.businessOverview);
    }
    if (body.sustainability !== undefined) patch.sustainability = objectOrDefault(body.sustainability);
    if (body.procurement !== undefined) patch.procurement = objectOrDefault(body.procurement);
    if (body.segmentDetails !== undefined) patch.segment_details = objectOrDefault(body.segmentDetails);
    if (body.declaration !== undefined) patch.declaration = objectOrDefault(body.declaration);

    const updatesApproval = body.approved !== undefined;
    const approved = Boolean(body.approved);

    if (updatesApproval) {
      patch.approved = approved;
      patch.approved_at = approved ? new Date().toISOString() : null;
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/buyers?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      },
    );

    const profileId = updatesApproval ? await getBuyerProfileId(id) : null;
    if (updatesApproval && profileId) {
      await supabaseServiceFetch<void>(
        `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${profileId}` })}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ buyer_approved: approved }),
        },
      );
    }

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_BUYER_PATCH_API_ERROR", error);
    return apiError("Unable to update buyer.", 503);
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
      `/rest/v1/buyers?${new URLSearchParams({ id: `eq.${id}` })}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_BUYER_DELETE_API_ERROR", error);
    return apiError("Unable to delete buyer.", 503);
  }
}
