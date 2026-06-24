import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireProfile,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const actor = await requireProfile(request);

    return apiOk({
      ok: true,
      user: {
        id: actor.user.id,
        email: actor.user.email || null,
      },
      profile: actor.profile,
      role: actor.role,
      buyerId: actor.buyerId,
      vendorId: actor.vendorId,
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

    console.error("API_ME_ERROR", error);
    return apiError("Unable to load the current user.", 503);
  }
}
