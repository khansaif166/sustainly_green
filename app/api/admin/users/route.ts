import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

type ProfileRow = {
  id: string;
  email: string;
  role: "ADMIN" | "VENDOR" | "BUYER";
  disabled: boolean;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<ProfileRow[]>(
      "/rest/v1/profiles?select=id,email,role,disabled&order=created_at.desc&limit=10000",
    );

    return apiOk({
      ok: true,
      users: rows.map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        blocked: row.disabled,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_USERS_GET_API_ERROR", error);
    return apiError("Unable to load users.", 503);
  }
}
