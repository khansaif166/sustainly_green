import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

/**
 * Switches the signed-in BUYER account to a VENDOR account.
 *
 * This exists for vendors who signed up as buyers by mistake. Accounts hold a
 * single role, so the buyer panel stops being reachable afterwards; for that
 * reason a buyer who has already raised RFQs is refused and pointed at
 * support rather than silently losing access to them. The new vendor starts
 * unapproved with an incomplete profile, so the normal onboarding and admin
 * approval still apply.
 *
 * Role changes must stay server-side: the guard_profile_privileged_columns
 * trigger blocks clients from writing `role` themselves.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireRole(request, ["BUYER"]);

    if (actor.buyerId) {
      const rfqs = await supabaseServiceFetch<Array<{ id: string }>>(
        `/rest/v1/rfqs?${new URLSearchParams({
          select: "id",
          buyer_id: `eq.${actor.buyerId}`,
          limit: "1",
        })}`,
      );

      if (rfqs.length > 0) {
        return apiError(
          "This buyer account already has RFQs, so it can't be switched automatically. Please contact support, or register your business with a different email.",
          409,
        );
      }
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${actor.profile.id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          role: "VENDOR",
          vendor_profile_complete: false,
          vendor_approved: false,
        }),
      },
    );

    return apiOk({ ok: true, redirectTo: "/vendor/onboarding" });
  } catch (error) {
    const authError = toAuthError(error);

    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const configError = toConfigError(error);

    if (configError) {
      return apiError(configError.message, configError.status);
    }

    console.error("BECOME_VENDOR_API_ERROR", error);
    return apiError("Unable to switch this account to a vendor account.", 503);
  }
}
