import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import { deleteVendorStorageFiles } from "@/lib/adminDeletion";


const VALID_ROLES = new Set(["ADMIN", "BUYER", "VENDOR"]);

type DeletableProfile = {
  id: string;
  auth_user_id: string | null;
  legacy_firebase_uid: string | null;
  email: string;
  role: "ADMIN" | "BUYER" | "VENDOR";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    if (id === actor.profile.id) {
      return apiError("Admins cannot modify their own account.", 403);
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!VALID_ROLES.has(body.role)) {
        return apiError("Invalid role value.", 400);
      }
      patch.role = body.role;
    }
    if (body.blocked !== undefined) patch.disabled = Boolean(body.blocked);

    if (!Object.keys(patch).length) {
      return apiError("No user update was provided.", 400);
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_USER_PATCH_API_ERROR", error);
    return apiError("Unable to update user.", 503);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    if (id === actor.profile.id) {
      return apiError("Admins cannot delete their own account.", 403);
    }

    const profiles = await supabaseServiceFetch<DeletableProfile[]>(
      `/rest/v1/profiles?${new URLSearchParams({
        select: "id,auth_user_id,legacy_firebase_uid,email,role",
        id: `eq.${id}`,
        limit: "1",
      })}`,
    );
    const profile = profiles[0];

    if (!profile) {
      return apiError("User not found.", 404);
    }

    if (profile.role === "VENDOR") {
      const vendors = await supabaseServiceFetch<Array<{ id: string }>>(
        `/rest/v1/vendors?${new URLSearchParams({
          select: "id",
          profile_id: `eq.${profile.id}`,
          limit: "1",
        })}`,
      );
      if (vendors[0]?.id) {
        await deleteVendorStorageFiles(vendors[0].id);
      }
    }

    if (profile.auth_user_id) {
      // The profiles table uses ON DELETE SET NULL for auth users and requires
      // at least one identity. Add a temporary legacy identity so Supabase Auth
      // can delete the user before the profile and its related records cascade.
      if (!profile.legacy_firebase_uid) {
        await supabaseServiceFetch<void>(
          `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${profile.id}` })}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({
              legacy_firebase_uid: `pending-delete:${profile.auth_user_id}`,
            }),
          },
        );
      }

      await supabaseServiceFetch<void>(
        `/auth/v1/admin/users/${encodeURIComponent(profile.auth_user_id)}`,
        { method: "DELETE" },
      );
    }

    await supabaseServiceFetch<void>(
      `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${profile.id}` })}`,
      {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      },
    );

    return apiOk({
      ok: true,
      deletedUser: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      },
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_USER_DELETE_API_ERROR", error);
    return apiError("Unable to delete user.", 503);
  }
}
