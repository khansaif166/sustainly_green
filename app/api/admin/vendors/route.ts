import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  supabaseServiceFetchAll,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import { validateVendorFields, vendorKey, vendorListingRecord } from "@/lib/vendorImport";

type VendorRow = {
  id: string;
  profile_id: string | null;
  company_name: string;
  logo_url: string | null;
  registration_type: string | null;
  cin_registration: string | null;
  gst_number: string | null;
  year_of_incorporation: string | null;
  business_type: string | null;
  primary_category: string | null;
  sub_categories: string[] | null;
  country: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  business_email: string | null;
  whatsapp: string | null;
  primary_contact_name: string | null;
  designation: string | null;
  primary_sustainability_cert: string | null;
  issuing_body: string | null;
  certificate_file_url: string | null;
  short_description: string | null;
  approved: boolean;
  status: string;
  claim_status: string | null;
  listing_verified: boolean | null;
  public_contact: Record<string, unknown> | null;
};

function mapVendor(row: VendorRow) {
  return {
    uid: row.id,
    id: row.id,
    profileId: row.profile_id,
    companyName: row.company_name,
    logoUrl: row.logo_url || "",
    registrationType: row.registration_type || "",
    cinRegistration: row.cin_registration || "",
    gstNumber: row.gst_number || "",
    yearOfIncorporation: row.year_of_incorporation || "",
    businessType: row.business_type || "",
    primaryCategory: row.primary_category || "",
    subCategories: row.sub_categories || [],
    country: row.country || "",
    city: row.city || "",
    state: row.state || "",
    pinCode: row.pin_code || "",
    businessEmail: row.business_email || "",
    whatsapp: row.whatsapp || "",
    primaryContactName: row.primary_contact_name || "",
    designation: row.designation || "",
    primarySustainabilityCert: row.primary_sustainability_cert || "",
    issuingBody: row.issuing_body || "",
    certificateFileUrl: row.certificate_file_url || "",
    shortDescription: row.short_description || "",
    approved: row.approved,
    status: row.status,
    claimedStatus: row.claim_status || "",
    listingVerified: Boolean(row.listing_verified),
    listingBadgeType:
      Boolean(row.listing_verified) && typeof row.public_contact?.sustainlyBadgeType === "string"
        ? row.public_contact.sustainlyBadgeType
        : Boolean(row.listing_verified)
          ? "verified_supplier"
          : "",
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetchAll<VendorRow>(
      "/rest/v1/vendors?select=id,profile_id,company_name,logo_url,registration_type,cin_registration,gst_number,year_of_incorporation,business_type,primary_category,sub_categories,country,city,state,pin_code,business_email,whatsapp,primary_contact_name,designation,primary_sustainability_cert,issuing_body,certificate_file_url,short_description,approved,status,claim_status,listing_verified,public_contact&order=created_at.desc,id.desc",
    );

    return apiOk({ ok: true, vendors: rows.map(mapVendor) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDORS_GET_API_ERROR", error);
    return apiError("Unable to load vendors.", 503);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Enter valid vendor details.", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError("Enter valid vendor details.", 400);
    }
    const { vendor, fieldErrors } = validateVendorFields(body as Record<string, unknown>);
    if (Object.keys(fieldErrors).length) {
      return apiError("Check the highlighted vendor details.", 400, { fieldErrors });
    }

    const existing = await supabaseServiceFetchAll<{
      company_name: string;
      registered_address: string | null;
      state: string | null;
    }>("/rest/v1/vendors?select=company_name,registered_address,state&order=id.asc");
    if (existing.some((row) => vendorKey(row.company_name, row.registered_address || "", row.state || "") === vendor.key)) {
      return apiError("A vendor with this company name, address, and state already exists.", 409);
    }

    const rows = await supabaseServiceFetch<Array<{ id: string }>>(
      "/rest/v1/vendors?select=id",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ ...vendorListingRecord(vendor), source: "ADMIN_CREATED" }),
      },
      false, // An insert cannot safely be retried after an uncertain response.
    );
    return apiOk({ ok: true, vendor: { id: rows[0].id } }, 201);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDORS_POST_API_ERROR", error);
    return apiError("Unable to create vendor. Please try again.", 503);
  }
}
