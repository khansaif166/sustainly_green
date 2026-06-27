import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


type VendorRow = {
  company_name: string | null;
  business_email: string | null;
  whatsapp: string | null;
  alternate_phone: string | null;
};

type CertificationRow = {
  id: string;
  name: string;
};

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function loadVendor(vendorId: string) {
  const params = new URLSearchParams({
    select: "company_name,business_email,whatsapp,alternate_phone",
    id: `eq.${vendorId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<VendorRow[]>(
    `/rest/v1/vendors?${params.toString()}`,
  );

  return rows[0] || null;
}

async function loadCertification(certificationId: string) {
  const params = new URLSearchParams({
    select: "id,name",
    id: `eq.${certificationId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<CertificationRow[]>(
    `/rest/v1/certifications?${params.toString()}`,
  );

  return rows[0] || null;
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);

    if (!actor.vendorId) {
      return apiError("Complete vendor onboarding before requesting certification.", 400);
    }

    const body = await request.json();
    const certificationId = stringOrNull(body.certificationId);

    if (!certificationId) {
      return apiError("Select certification.", 400);
    }

    const [vendor, certification] = await Promise.all([
      loadVendor(actor.vendorId),
      loadCertification(certificationId),
    ]);

    if (!vendor) return apiError("Vendor profile not found.", 404);
    if (!certification) return apiError("Certification not found.", 404);

    await supabaseServiceFetch<void>("/rest/v1/certification_requests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        vendor_id: actor.vendorId,
        certification_id: certification.id,
        company_name: vendor.company_name || actor.profile.name,
        email: vendor.business_email || actor.profile.email,
        phone: vendor.whatsapp || vendor.alternate_phone || null,
        certification_name: certification.name,
        message: stringOrNull(body.message),
        status: "NEW",
        raw_firebase: {
          contactPerson: stringOrNull(body.contactPerson),
          designation: stringOrNull(body.designation),
          employees: stringOrNull(body.employees),
          locations: stringOrNull(body.locations),
          timeline: stringOrNull(body.timeline),
          businessScope: stringOrNull(body.businessScope),
          previousCertification: stringOrNull(body.previousCertification),
        },
      }),
    });

    return apiOk({ ok: true }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("CERTIFICATION_REQUEST_POST_API_ERROR", error);
    return apiError("Unable to submit certification request.", 503);
  }
}
