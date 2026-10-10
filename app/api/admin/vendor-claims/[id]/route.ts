import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

type Body = { action?: string; notes?: string };

/**
 * Approves or rejects a vendor claim. The work happens in the
 * approve_vendor_claim / reject_vendor_claim database functions so the
 * ownership handover is all-or-nothing; their error messages are written for
 * the admin and are passed straight through.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireRole(request, ["ADMIN"]);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Body;

    if (body.action !== "approve" && body.action !== "reject") {
      return apiError('action must be "approve" or "reject".', 400);
    }

    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 1000) : null;
    const fn = body.action === "approve" ? "approve_vendor_claim" : "reject_vendor_claim";

    try {
      await supabaseServiceFetch<void>(`/rest/v1/rpc/${fn}`, {
        method: "POST",
        body: JSON.stringify({
          p_claim_id: id,
          p_reviewer_profile_id: actor.profile.id,
          p_notes: notes,
        }),
      });
    } catch (rpcError) {
      // Raised by the function itself (already reviewed, listing owned, ...).
      const message = rpcError instanceof Error ? rpcError.message : "";
      console.error("ADMIN_VENDOR_CLAIM_RPC_ERROR", rpcError);
      return apiError(message || "Unable to update this claim.", 409);
    }

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDOR_CLAIM_POST_API_ERROR", error);
    return apiError("Unable to update this claim.", 503);
  }
}
