import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";


async function getVendorProfileId(id: string) {
  const rows = await supabaseServiceFetch<Array<{ profile_id: string | null }>>(
    `/rest/v1/vendors?${new URLSearchParams({ select: "profile_id", id: `eq.${id}`, limit: "1" })}`,
  );
  return rows[0]?.profile_id || null;
}

type VendorRow = {
  id: string;
  profile_id: string | null;
  company_name: string;
  logo_url: string | null;
  registration_type: string | null;
  cin_registration: string | null;
  gst_number: string | null;
  year_of_incorporation: string | null;
  registered_address: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  country: string | null;
  primary_contact_name: string | null;
  designation: string | null;
  business_email: string | null;
  whatsapp: string | null;
  alternate_phone: string | null;
  business_type: string | null;
  primary_category: string | null;
  sub_categories: string[] | null;
  short_description: string | null;
  key_products: string[] | null;
  export_capability: boolean;
  export_markets: string | null;
  primary_sustainability_cert: string | null;
  issuing_body: string | null;
  certificate_file_url: string | null;
  sustainability_practice: string | null;
  recycled_content: string | null;
  carbon_footprint: string | null;
  social_compliance: string | null;
  listing_tier: string | null;
  awards_image_url: string | null;
  payment_terms: string | null;
  language: string | null;
  approved: boolean;
  status: string;
  updated_at: string;
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
    registeredAddress: row.registered_address || "",
    city: row.city || "",
    state: row.state || "",
    pinCode: row.pin_code || "",
    country: row.country || "",
    primaryContactName: row.primary_contact_name || "",
    designation: row.designation || "",
    businessEmail: row.business_email || "",
    whatsapp: row.whatsapp || "",
    alternatePhone: row.alternate_phone || "",
    businessType: row.business_type || "",
    primaryCategory: row.primary_category || "",
    subCategories: row.sub_categories || [],
    shortDescription: row.short_description || "",
    keyProducts: row.key_products || [],
    exportCapability: Boolean(row.export_capability),
    exportMarkets: row.export_markets || "",
    primarySustainabilityCert: row.primary_sustainability_cert || "",
    issuingBody: row.issuing_body || "",
    certificateFileUrl: row.certificate_file_url || "",
    sustainabilityPractice: row.sustainability_practice || "",
    recycledContent: row.recycled_content || "",
    carbonFootprint: row.carbon_footprint || "",
    socialCompliance: row.social_compliance || "",
    listingTier: row.listing_tier || "",
    awardsImageUrl: row.awards_image_url || "",
    paymentTerms: row.payment_terms || "",
    language: row.language || "",
    approved: row.approved,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function arrayOrEmpty(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

const VENDOR_FIELD_MAP: Record<string, string> = {
  companyName: "company_name",
  logoUrl: "logo_url",
  registrationType: "registration_type",
  cinRegistration: "cin_registration",
  gstNumber: "gst_number",
  yearOfIncorporation: "year_of_incorporation",
  registeredAddress: "registered_address",
  city: "city",
  state: "state",
  pinCode: "pin_code",
  country: "country",
  primaryContactName: "primary_contact_name",
  designation: "designation",
  businessEmail: "business_email",
  whatsapp: "whatsapp",
  alternatePhone: "alternate_phone",
  businessType: "business_type",
  primaryCategory: "primary_category",
  shortDescription: "short_description",
  exportMarkets: "export_markets",
  primarySustainabilityCert: "primary_sustainability_cert",
  issuingBody: "issuing_body",
  certificateFileUrl: "certificate_file_url",
  sustainabilityPractice: "sustainability_practice",
  recycledContent: "recycled_content",
  carbonFootprint: "carbon_footprint",
  socialCompliance: "social_compliance",
  listingTier: "listing_tier",
  awardsImageUrl: "awards_image_url",
  paymentTerms: "payment_terms",
  language: "language",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    const rows = await supabaseServiceFetch<VendorRow[]>(
      `/rest/v1/vendors?${new URLSearchParams({
        select:
          "id,profile_id,company_name,logo_url,registration_type,cin_registration,gst_number,year_of_incorporation,registered_address,city,state,pin_code,country,primary_contact_name,designation,business_email,whatsapp,alternate_phone,business_type,primary_category,sub_categories,short_description,key_products,export_capability,export_markets,primary_sustainability_cert,issuing_body,certificate_file_url,sustainability_practice,recycled_content,carbon_footprint,social_compliance,listing_tier,awards_image_url,payment_terms,language,approved,status,updated_at",
        id: `eq.${id}`,
        limit: "1",
      })}`,
    );

    const vendor = rows[0];
    if (!vendor) return apiError("Vendor not found.", 404);

    return apiOk({ ok: true, vendor: mapVendor(vendor) });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDOR_GET_API_ERROR", error);
    return apiError("Unable to load vendor.", 503);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = await request.json();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const [clientKey, column] of Object.entries(VENDOR_FIELD_MAP)) {
      if (body[clientKey] !== undefined) {
        patch[column] = stringOrNull(body[clientKey]);
      }
    }

    if (body.subCategories !== undefined) patch.sub_categories = arrayOrEmpty(body.subCategories);
    if (body.keyProducts !== undefined) patch.key_products = arrayOrEmpty(body.keyProducts);
    if (body.exportCapability !== undefined) {
      patch.export_capability = Boolean(body.exportCapability);
    }

    const updatesApproval = body.approved !== undefined;
    const approved = Boolean(body.approved);

    if (updatesApproval) {
      patch.approved = approved;
      patch.status = approved ? "approved" : "submitted";
      patch.approved_at = approved ? new Date().toISOString() : null;
    }

    // Fetch profileId before committing the vendor update so a failure here
    // doesn't leave the vendor half-approved with no corresponding profile update.
    const profileId = updatesApproval ? await getVendorProfileId(id) : null;

    await supabaseServiceFetch<void>(
      `/rest/v1/vendors?${new URLSearchParams({ id: `eq.${id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      },
    );

    if (updatesApproval && profileId) {
      await supabaseServiceFetch<void>(
        `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${profileId}` })}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ vendor_approved: approved }),
        },
      );
    }

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDOR_PATCH_API_ERROR", error);
    return apiError("Unable to update vendor.", 503);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    await supabaseServiceFetch<void>(
      `/rest/v1/vendors?${new URLSearchParams({ id: `eq.${id}` })}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );

    return apiOk({ ok: true });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDOR_DELETE_API_ERROR", error);
    return apiError("Unable to delete vendor.", 503);
  }
}
