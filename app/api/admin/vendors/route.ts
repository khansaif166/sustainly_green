import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


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
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const rows = await supabaseServiceFetch<VendorRow[]>(
      "/rest/v1/vendors?select=id,profile_id,company_name,logo_url,registration_type,cin_registration,gst_number,year_of_incorporation,business_type,primary_category,sub_categories,country,city,state,pin_code,business_email,whatsapp,primary_contact_name,designation,primary_sustainability_cert,issuing_body,certificate_file_url,short_description,approved,status,claim_status,listing_verified&order=created_at.desc&limit=10000",
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
