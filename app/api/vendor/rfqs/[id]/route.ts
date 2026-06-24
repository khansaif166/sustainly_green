import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import {
  loadVendorContact,
  loadVendorRfq,
  mapVendorRfq,
} from "@/lib/vendorRfqsServer";

export const runtime = "edge";

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiError("Complete vendor onboarding before responding to RFQs.", 400);
    }

    const { id } = await context.params;
    const rfq = await loadVendorRfq(id, actor.vendorId);

    if (!rfq) {
      return apiError("RFQ not found.", 404);
    }

    const body = await request.json();
    const price = Number(body.price);
    const deliveryTimeline = stringOrNull(body.deliveryTimeline);

    if (!Number.isFinite(price) || !deliveryTimeline) {
      return apiError("Please fill price and delivery timeline.", 400);
    }

    const contact = await loadVendorContact(actor.vendorId);

    await supabaseServiceFetch<void>(
      `/rest/v1/rfqs?${new URLSearchParams({ id: `eq.${id}`, vendor_id: `eq.${actor.vendorId}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "QUOTED",
          vendor_response: {
            price,
            currency: stringOrNull(body.currency) || "INR",
            deliveryTimeline,
            message: stringOrNull(body.message) || "",
          },
          vendor_contact: {
            phone: contact?.whatsapp || contact?.alternate_phone || "",
            email: contact?.business_email || actor.profile.email || "",
          },
          responded_at: new Date().toISOString(),
        }),
      },
    );

    const updated = await loadVendorRfq(id, actor.vendorId);
    if (!updated) return apiError("RFQ not found after update.", 404);

    return apiOk({ ok: true, rfq: mapVendorRfq(updated) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_RFQ_PATCH_API_ERROR", error);
    return apiError("Unable to send quote.", 503);
  }
}
