import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type RfqDetailRow = {
  id: string;
  buyer_id: string | null;
  vendor_id: string | null;
  product_id: string | null;
  requirement_title: string;
  requirement_type: string | null;
  category: string | null;
  estimated_quantity: string | null;
  delivery_country: string | null;
  required_timeline: string | null;
  additional_details: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  status: string;
  contact_shared: boolean | null;
  vendor_response: Record<string, unknown> | null;
  vendor_contact: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapRfq(row: RfqDetailRow) {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    vendorId: row.vendor_id,
    productId: row.product_id,
    requirementTitle: row.requirement_title,
    requirementType: row.requirement_type || "",
    category: row.category || "",
    estimatedQuantity: row.estimated_quantity || "",
    deliveryCountry: row.delivery_country || "",
    requiredTimeline: row.required_timeline || "",
    additionalDetails: row.additional_details || "",
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone || "",
    status: row.status,
    contactShared: Boolean(row.contact_shared),
    vendorResponse: row.vendor_response || undefined,
    vendorContact: row.vendor_contact || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadOwnedRfq(id: string, buyerId: string) {
  const params = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    buyer_id: `eq.${buyerId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<RfqDetailRow[]>(
    `/rest/v1/rfqs?${params.toString()}`,
  );

  return rows[0] || null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["BUYER", "ADMIN"]);

    if (!actor.buyerId) {
      return apiError("Complete buyer onboarding before viewing RFQs.", 400);
    }

    const { id } = await context.params;
    const row = await loadOwnedRfq(id, actor.buyerId);

    if (!row) {
      return apiError("RFQ not found.", 404);
    }

    return apiOk({ ok: true, rfq: mapRfq(row) });
  } catch (error) {
    const authError = toAuthError(error);

    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const configError = toConfigError(error);

    if (configError) {
      return apiError(configError.message, configError.status);
    }

    console.error("BUYER_RFQ_DETAIL_API_ERROR", error);
    return apiError("Unable to load RFQ.", 503);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["BUYER", "ADMIN"]);

    if (!actor.buyerId) {
      return apiError("Complete buyer onboarding before updating RFQs.", 400);
    }

    const { id } = await context.params;
    const body = await request.json();
    const action = String(body.action || "");

    const current = await loadOwnedRfq(id, actor.buyerId);

    if (!current) {
      return apiError("RFQ not found.", 404);
    }

    if (action !== "accept" && action !== "reject") {
      return apiError("Unsupported RFQ action.", 400);
    }

    const payload =
      action === "accept"
        ? {
            status: "ACCEPTED",
            contact_shared: true,
          }
        : {
            status: "CANCELLED",
            contact_shared: false,
          };

    const params = new URLSearchParams({
      id: `eq.${id}`,
      buyer_id: `eq.${actor.buyerId}`,
    });

    const rows = await supabaseServiceFetch<RfqDetailRow[]>(
      `/rest/v1/rfqs?${params.toString()}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      },
    );

    return apiOk({ ok: true, rfq: mapRfq(rows[0]) });
  } catch (error) {
    const authError = toAuthError(error);

    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const configError = toConfigError(error);

    if (configError) {
      return apiError(configError.message, configError.status);
    }

    console.error("BUYER_RFQ_UPDATE_API_ERROR", error);
    return apiError("Unable to update RFQ.", 503);
  }
}
