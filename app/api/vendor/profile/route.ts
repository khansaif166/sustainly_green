import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "edge";

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
  sub_categories: string[];
  short_description: string | null;
  key_products: string[];
  target_industries: string | null;
  preferred_buyer_geography: string | null;
  supply_capacity: string | null;
  moq: string | null;
  export_capability: boolean | null;
  export_markets: string | null;
  primary_sustainability_cert: string | null;
  issuing_body: string | null;
  certificate_file_url: string | null;
  additional_certs: unknown[];
  sustainability_practice: string | null;
  recycled_content: string | null;
  carbon_footprint: string | null;
  epr_registration: string | null;
  social_compliance: string | null;
  net_zero_commitment: string | null;
  listing_tier: string | null;
  case_studies: string | null;
  awards: string | null;
  awards_image_url: string | null;
  looking_for_buyers_in: string | null;
  willingness_to_offer_samples: boolean | null;
  payment_terms: string | null;
  language: string | null;
  eco_score: Record<string, unknown>;
  declaration: Record<string, unknown>;
  approved: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function mapVendor(row: VendorRow | null) {
  if (!row) return null;

  return {
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
    targetIndustries: row.target_industries || "",
    preferredBuyerGeography: row.preferred_buyer_geography || "",
    supplyCapacity: row.supply_capacity || "",
    moq: row.moq || "",
    exportCapability: Boolean(row.export_capability),
    exportMarkets: row.export_markets || "",
    primarySustainabilityCert: row.primary_sustainability_cert || "",
    issuingBody: row.issuing_body || "",
    certificateFileUrl: row.certificate_file_url || "",
    additionalCerts: row.additional_certs || [],
    sustainabilityPractice: row.sustainability_practice || "",
    recycledContent: row.recycled_content || "",
    carbonFootprint: row.carbon_footprint || "",
    eprRegistration: row.epr_registration || "",
    socialCompliance: row.social_compliance || "",
    netZeroCommitment: row.net_zero_commitment || "",
    listingTier: row.listing_tier || "",
    caseStudies: row.case_studies || "",
    awards: row.awards || "",
    awardsImageUrl: row.awards_image_url || "",
    lookingForBuyersIn: row.looking_for_buyers_in || "",
    willingnessToOfferSamples: Boolean(row.willingness_to_offer_samples),
    paymentTerms: row.payment_terms || "",
    language: row.language || "",
    lifecycleStage: row.eco_score?.lifecycleStage || "",
    packaging: row.eco_score?.packaging || "",
    energySource: row.eco_score?.energySource || "",
    waterRecycling: row.eco_score?.waterRecycling || "",
    wasteReduction: row.eco_score?.wasteReduction || "",
    sdgAlignment: Array.isArray(row.eco_score?.sdgAlignment) ? row.eco_score.sdgAlignment : [],
    auditFrequency: row.eco_score?.auditFrequency || "",
    certifyingBody: row.eco_score?.certifyingBody || "",
    ghgScope1: row.eco_score?.ghgScope1 || "",
    ghgScope2: row.eco_score?.ghgScope2 || "",
    ghgScope3: row.eco_score?.ghgScope3 || "",
    declarationAgreed: Boolean(row.declaration?.agreed),
    declarationName: row.declaration?.name || "",
    declarationDate: row.declaration?.date || "",
    approved: Boolean(row.approved),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchVendor(profileId: string) {
  const params = new URLSearchParams({
    select: "*",
    profile_id: `eq.${profileId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<VendorRow[]>(
    `/rest/v1/vendors?${params.toString()}`,
  );

  return rows[0] || null;
}

function buildPayload(body: Record<string, unknown>, profileId: string) {
  return {
    profile_id: profileId,
    company_name: stringOrNull(body.companyName) || "Unnamed Vendor",
    logo_url: stringOrNull(body.logoUrl),
    registration_type: stringOrNull(body.registrationType),
    cin_registration: stringOrNull(body.cinRegistration),
    gst_number: stringOrNull(body.gstNumber),
    year_of_incorporation: stringOrNull(body.yearOfIncorporation),
    registered_address: stringOrNull(body.registeredAddress),
    city: stringOrNull(body.city),
    state: stringOrNull(body.state),
    pin_code: stringOrNull(body.pinCode),
    country: stringOrNull(body.country),
    primary_contact_name: stringOrNull(body.primaryContactName),
    designation: stringOrNull(body.designation),
    business_email: stringOrNull(body.businessEmail),
    whatsapp: stringOrNull(body.whatsapp),
    alternate_phone: stringOrNull(body.alternatePhone),
    business_type: stringOrNull(body.businessType),
    primary_category: stringOrNull(body.primaryCategory),
    sub_categories: arrayValue(body.subCategories),
    short_description: stringOrNull(body.shortDescription),
    key_products: arrayValue(body.keyProducts),
    target_industries: stringOrNull(body.targetIndustries),
    preferred_buyer_geography: stringOrNull(body.preferredBuyerGeography),
    supply_capacity: stringOrNull(body.supplyCapacity),
    moq: stringOrNull(body.moq),
    export_capability: Boolean(body.exportCapability),
    export_markets: stringOrNull(body.exportMarkets),
    primary_sustainability_cert: stringOrNull(body.primarySustainabilityCert),
    issuing_body: stringOrNull(body.issuingBody),
    certificate_file_url: stringOrNull(body.certificateFileUrl),
    additional_certs: Array.isArray(body.additionalCerts) ? body.additionalCerts : [],
    sustainability_practice: stringOrNull(body.sustainabilityPractice),
    recycled_content: stringOrNull(body.recycledContent),
    carbon_footprint: stringOrNull(body.carbonFootprint),
    epr_registration: stringOrNull(body.eprRegistration),
    social_compliance: stringOrNull(body.socialCompliance),
    net_zero_commitment: stringOrNull(body.netZeroCommitment),
    listing_tier: stringOrNull(body.listingTier),
    case_studies: stringOrNull(body.caseStudies),
    awards: stringOrNull(body.awards),
    awards_image_url: stringOrNull(body.awardsImageUrl),
    looking_for_buyers_in: stringOrNull(body.lookingForBuyersIn),
    willingness_to_offer_samples: Boolean(body.willingnessToOfferSamples),
    payment_terms: stringOrNull(body.paymentTerms),
    language: stringOrNull(body.language),
    eco_score: {
      lifecycleStage: body.lifecycleStage || "",
      packaging: body.packaging || "",
      energySource: body.energySource || "",
      waterRecycling: body.waterRecycling || "",
      wasteReduction: body.wasteReduction || "",
      sdgAlignment: arrayValue(body.sdgAlignment),
      auditFrequency: body.auditFrequency || "",
      certifyingBody: body.certifyingBody || "",
      ghgScope1: body.ghgScope1 || "",
      ghgScope2: body.ghgScope2 || "",
      ghgScope3: body.ghgScope3 || "",
    },
    declaration: {
      agreed: Boolean(body.declarationAgreed),
      name: body.declarationName || "",
      date: body.declarationDate || "",
    },
    status: "submitted",
    claim_status: "CLAIMED",
  };
}

export async function GET(request: Request) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);
    const vendor = await fetchVendor(actor.profile.id);

    return apiOk({
      ok: true,
      profile: actor.profile,
      vendor: mapVendor(vendor),
      profileComplete: actor.profile.vendor_profile_complete,
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_PROFILE_GET_API_ERROR", error);
    return apiError("Unable to load vendor profile.", 503);
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireRole(request, ["VENDOR", "ADMIN"]);
    const body = await request.json();
    const payload = buildPayload(body, actor.profile.id);

    const rows = await supabaseServiceFetch<VendorRow[]>(
      "/rest/v1/vendors?on_conflict=profile_id",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      },
    );

    await supabaseServiceFetch<void>(
      `/rest/v1/profiles?${new URLSearchParams({ id: `eq.${actor.profile.id}` })}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          vendor_profile_complete: true,
          company_name: payload.company_name,
        }),
      },
    );

    return apiOk({
      ok: true,
      vendor: mapVendor(rows[0]),
      profileComplete: true,
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("VENDOR_PROFILE_PUT_API_ERROR", error);
    return apiError("Unable to save vendor profile.", 503);
  }
}
