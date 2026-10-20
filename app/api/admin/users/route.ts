import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type ProfileRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "ADMIN" | "VENDOR" | "BUYER";
  disabled: boolean;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<ProfileRow[]>(
      "/rest/v1/profiles?select=id,name,email,phone,role,disabled&order=created_at.desc&limit=10000",
    );

    return apiOk({
      ok: true,
      users: rows.map((row) => ({
        id: row.id,
        name: row.name || "",
        email: row.email,
        // Collected on the register form; empty for accounts created before.
        phone: row.phone || "",
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
