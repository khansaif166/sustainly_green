import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

type RfqRow = {
  id: string;
  vendor_id: string | null;
  product_id: string | null;
  requirement_title: string;
  requirement_type: string | null;
  category: string | null;
  status: string;
  delivery_country: string | null;
  estimated_quantity: string | null;
  required_timeline: string | null;
  additional_details: string | null;
  vendor_response: {
    price?: number;
    currency?: string;
    message?: string;
  } | null;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    const actor = await requireRole(request, ["BUYER", "ADMIN"]);

    if (!actor.buyerId) {
      return apiOk({ ok: true, needsOnboarding: true, rfqs: [] });
    }

    const params = new URLSearchParams({
      select:
        "id,vendor_id,product_id,requirement_title,requirement_type,category,status,delivery_country,estimated_quantity,required_timeline,additional_details,vendor_response,created_at",
      buyer_id: `eq.${actor.buyerId}`,
      order: "created_at.desc",
    });

    const rows = await supabaseServiceFetch<RfqRow[]>(
      `/rest/v1/rfqs?${params.toString()}`,
    );

    return apiOk({
      ok: true,
      needsOnboarding: !actor.profile.buyer_profile_complete,
      rfqs: rows.map((row) => ({
        id: row.id,
        vendorId: row.vendor_id,
        productId: row.product_id,
        requirementTitle: row.requirement_title,
        requirementType: row.requirement_type || "",
        category: row.category || "",
        status: row.status,
        deliveryCountry: row.delivery_country || "",
        estimatedQuantity: row.estimated_quantity || "",
        requiredTimeline: row.required_timeline || "",
        additionalDetails: row.additional_details || "",
        vendorResponse: row.vendor_response || undefined,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);

    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const configError = toConfigError(error);

    if (configError) {
      return apiError(configError.message, configError.status);
    }

    console.error("BUYER_RFQS_API_ERROR", error);
    return apiError("Unable to load buyer RFQs.", 503);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(request, ["BUYER", "ADMIN"]);

    if (!actor.buyerId) {
      return apiError("Complete buyer onboarding before creating RFQs.", 400);
    }

    const body = await request.json();
    const requirementTitle = String(body.requirementTitle || "").trim();
    const estimatedQuantity = String(body.estimatedQuantity || "").trim();
    const deliveryCountry = String(body.deliveryCountry || "").trim();
    const requiredTimeline = String(body.requiredTimeline || "").trim();
    const buyerName = String(actor.profile.name || "").trim();
    const buyerEmail = String(actor.profile.email || "").trim();

    if (
      !requirementTitle ||
      !estimatedQuantity ||
      !deliveryCountry ||
      !requiredTimeline ||
      !buyerName ||
      !buyerEmail
    ) {
      return apiError("Please fill all required RFQ fields.", 400);
    }

    const payload = {
      buyer_id: actor.buyerId,
      vendor_id: body.vendorId || null,
      product_id: body.productId || null,
      requirement_title: requirementTitle,
      requirement_type: body.requirementType || "PRODUCT",
      category: body.category || null,
      estimated_quantity: estimatedQuantity,
      delivery_country: deliveryCountry,
      required_timeline: requiredTimeline,
      additional_details: body.additionalDetails || null,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: body.buyerPhone || null,
      status: "RFQ_REQUESTED",
      contact_shared: false,
      vendor_response: {},
      vendor_contact: {},
    };

    const created = await supabaseServiceFetch<Array<{ id: string }>>(
      "/rest/v1/rfqs",
      {
        method: "POST",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      },
    );

    return apiOk({ ok: true, id: created[0]?.id }, 201);
  } catch (error) {
    const authError = toAuthError(error);

    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const configError = toConfigError(error);

    if (configError) {
      return apiError(configError.message, configError.status);
    }

    console.error("BUYER_RFQ_CREATE_API_ERROR", error);
    return apiError("Unable to create RFQ.", 503);
  }
}
