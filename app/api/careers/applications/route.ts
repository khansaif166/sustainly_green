import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireProfile,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  try {
    await requireProfile(request);
    const body = await request.json();
    const careerId = stringOrNull(body.careerId);
    const jobTitle = stringOrNull(body.jobTitle);
    const name = stringOrNull(body.name);
    const email = stringOrNull(body.email);

    if (!careerId || !jobTitle || !name || !email) {
      return apiError("Please fill all required application fields.", 400);
    }

    await supabaseServiceFetch<void>("/rest/v1/job_applications", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        career_id: careerId,
        job_title: jobTitle,
        name,
        email,
        phone: stringOrNull(body.phone),
        resume_url: stringOrNull(body.resumeUrl),
        resume_storage_path: stringOrNull(body.resumeStoragePath),
        status: "NEW",
      }),
    });

    return apiOk({ ok: true }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("CAREER_APPLICATION_POST_API_ERROR", error);
    return apiError("Unable to submit application.", 503);
  }
}
