import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type JobApplicationRow = {
  id: string;
  career_id: string | null;
  job_title: string | null;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<JobApplicationRow[]>(
      "/rest/v1/job_applications?select=id,career_id,job_title,name,email,phone,resume_url,created_at&order=created_at.desc&limit=1000",
    );

    return apiOk({
      ok: true,
      applications: rows.map((row) => ({
        id: row.id,
        jobId: row.career_id || "",
        jobTitle: row.job_title || "",
        name: row.name,
        email: row.email,
        phone: row.phone || "",
        resumeURL: row.resume_url || "",
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_JOB_APPLICATIONS_API_ERROR", error);
    return apiError("Unable to load job applications.", 503);
  }
}
