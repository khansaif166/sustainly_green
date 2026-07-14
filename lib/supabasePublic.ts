type SupabaseVendorRow = {
  id: string;
  company_name: string | null;
  logo_url: string | null;
  registered_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  business_email: string | null;
  primary_category: string | null;
  sub_categories: string[] | null;
  short_description: string | null;
  primary_sustainability_cert: string | null;
  eco_score: number | null;
  approved: boolean | null;
  claim_status: "UNCLAIMED" | "CLAIM_REQUESTED" | "CLAIMED" | "REJECTED" | null;
  listing_verified: boolean | null;
  public_contact: Record<string, unknown> | null;
};

type SupabaseCategoryRow = {
  id: string;
  name: string | null;
  slug: string | null;
  image_url: string | null;
  active: boolean | null;
  sort_order: number | null;
};

type SupabaseProductRow = {
  id: string;
  vendor_id: string;
  vendor_name: string | null;
  title: string | null;
  description: string | null;
  listing_type: string | null;
  available_for: string[] | null;
  price_type: string | null;
  price: number | string | null;
  currency: string | null;
  moq: number | string | null;
  ship_regions: string[] | null;
  sustainability_claim: string | null;
  approved: boolean | null;
  featured: boolean | null;
  product_images?: Array<{ url: string | null; sort_order: number | null }>;
};

type SupabaseBlogRow = {
  id: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string | null;
  published: boolean | null;
};

type SupabaseCareerRow = {
  id: string;
  title: string | null;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  active: boolean | null;
  created_at: string | null;
};

export type PublicVendor = {
  id: string;
  companyName: string;
  logoUrl?: string;
  description?: string;
  email?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  category?: string;
  subCategories?: string[];
  ecoScore?: number;
  certifications?: string[];
  approved: boolean;
  claimStatus?: string;
  listingVerified?: boolean;
  listingBadgeType?: string;
  isClaimed: boolean;
  isUnclaimed: boolean;
  isClaimRequested: boolean;
  publicContact?: Record<string, unknown>;
  logoText: string;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  active: boolean;
  sortOrder?: number;
};

export type PublicProduct = {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description?: string;
  images: string[];
  listingType?: string;
  availableFor: string[];
  shipRegions: string[];
  priceType?: string;
  price?: number;
  currency: string;
  moq?: number;
  sustainabilityTags: string[];
  tagNames: string[];
  approved: boolean;
  featured: boolean;
};

export type PublicBlog = {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  image?: string;
  createdAt?: string;
};

export type PublicCareer = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  active: boolean;
  createdAt?: string;
};

export type VendorClaimInput = {
  vendorId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterDesignation?: string;
  companyEmail?: string;
  companyWebsite?: string;
  proofType?: string;
  proofDetails?: string;
  message?: string;
  profileId?: string;
  accessToken?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const VENDOR_SELECT = [
  "id",
  "company_name",
  "logo_url",
  "registered_address",
  "city",
  "state",
  "country",
  "business_email",
  "primary_category",
  "sub_categories",
  "short_description",
  "primary_sustainability_cert",
  "eco_score",
  "approved",
  "claim_status",
  "listing_verified",
  "public_contact",
].join(",");

const PRODUCT_SELECT = [
  "id",
  "vendor_id",
  "vendor_name",
  "title",
  "description",
  "listing_type",
  "available_for",
  "price_type",
  "price",
  "currency",
  "moq",
  "ship_regions",
  "sustainability_claim",
  "approved",
  "featured",
  "product_images(url,sort_order)",
].join(",");

function requireSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase public environment variables.");
  }
}

async function supabaseGet<T>(path: string): Promise<T> {
  requireSupabaseConfig();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${message}`);
  }

  return response.json() as Promise<T>;
}

async function supabasePostMinimal(
  path: string,
  payload: unknown,
  accessToken?: string,
): Promise<void> {
  requireSupabaseConfig();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${message}`);
  }
}

function initials(name: string) {
  const mark = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return mark || "V";
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function compactLocation(parts: Array<string | null>) {
  return parts.filter(Boolean).join(", ");
}

function mapVendor(row: SupabaseVendorRow): PublicVendor {
  const companyName = stringValue(row.company_name) || "Unnamed Vendor";
  const city = stringValue(row.city);
  const state = stringValue(row.state);
  const country = stringValue(row.country);
  const location = compactLocation([city, state, country]);
  const registeredAddress = stringValue(row.registered_address);
  const certifications = row.primary_sustainability_cert
    ? [String(row.primary_sustainability_cert)]
    : [];
  const claimStatus = row.claim_status || undefined;

  return {
    id: row.id,
    companyName,
    logoUrl: stringValue(row.logo_url) || undefined,
    description: stringValue(row.short_description) || registeredAddress || undefined,
    email: stringValue(row.business_email) || undefined,
    location: location || registeredAddress || undefined,
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
    category: stringValue(row.primary_category) || undefined,
    subCategories: stringArray(row.sub_categories),
    ecoScore: row.eco_score ?? undefined,
    certifications,
    approved: Boolean(row.approved),
    claimStatus,
    listingVerified: Boolean(row.listing_verified),
    listingBadgeType:
      Boolean(row.listing_verified) && typeof row.public_contact?.sustainlyBadgeType === "string"
        ? row.public_contact.sustainlyBadgeType
        : Boolean(row.listing_verified)
          ? "eco_verified"
          : undefined,
    isClaimed: claimStatus === "CLAIMED",
    isUnclaimed: claimStatus === "UNCLAIMED",
    isClaimRequested: claimStatus === "CLAIM_REQUESTED",
    publicContact: row.public_contact || undefined,
    logoText: initials(companyName),
  };
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean) as string[]
    : [];
}

function mapCategory(row: SupabaseCategoryRow): PublicCategory {
  return {
    id: row.id,
    name: stringValue(row.name) || "Unnamed Category",
    slug: stringValue(row.slug) || undefined,
    imageUrl: stringValue(row.image_url) || undefined,
    active: Boolean(row.active),
    sortOrder: row.sort_order ?? undefined,
  };
}

function mapProduct(row: SupabaseProductRow): PublicProduct {
  const images = (row.product_images || [])
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((image) => stringValue(image.url))
    .filter(Boolean) as string[];
  const sustainabilityClaim = stringValue(row.sustainability_claim);

  return {
    id: row.id,
    vendorId: row.vendor_id,
    vendorName: stringValue(row.vendor_name) || "Listed Supplier",
    title: stringValue(row.title) || "Untitled Product",
    description: stringValue(row.description) || undefined,
    images,
    listingType: stringValue(row.listing_type) || undefined,
    availableFor: stringArray(row.available_for),
    shipRegions: stringArray(row.ship_regions),
    priceType: stringValue(row.price_type) || undefined,
    price: numberValue(row.price),
    currency: stringValue(row.currency) || "INR",
    moq: numberValue(row.moq),
    sustainabilityTags: sustainabilityClaim ? [sustainabilityClaim] : [],
    tagNames: sustainabilityClaim ? [sustainabilityClaim] : [],
    approved: Boolean(row.approved),
    featured: Boolean(row.featured),
  };
}

function mapBlog(row: SupabaseBlogRow): PublicBlog {
  return {
    id: row.id,
    title: stringValue(row.title) || "Untitled Blog",
    excerpt: stringValue(row.excerpt) || undefined,
    content: stringValue(row.content) || "",
    image: stringValue(row.image_url) || undefined,
    createdAt: stringValue(row.created_at) || undefined,
  };
}

function mapCareer(row: SupabaseCareerRow): PublicCareer {
  return {
    id: row.id,
    title: stringValue(row.title) || "Untitled Role",
    department: stringValue(row.department) || "",
    location: stringValue(row.location) || "",
    type: stringValue(row.employment_type) || "",
    description: stringValue(row.description) || "",
    active: Boolean(row.active),
    createdAt: stringValue(row.created_at) || undefined,
  };
}

export async function fetchApprovedVendors(limit = 1000): Promise<PublicVendor[]> {
  const params = new URLSearchParams({
    select: VENDOR_SELECT,
    approved: "eq.true",
    order: "company_name.asc",
    limit: String(limit),
  });
  const rows = await supabaseGet<SupabaseVendorRow[]>(`vendors?${params}`);
  return rows.map(mapVendor);
}

export async function fetchActiveCategories(limit = 100): Promise<PublicCategory[]> {
  const params = new URLSearchParams({
    select: "id,name,slug,image_url,active,sort_order",
    active: "eq.true",
    order: "sort_order.asc.nullslast,name.asc",
    limit: String(limit),
  });
  const rows = await supabaseGet<SupabaseCategoryRow[]>(`categories?${params}`);
  return rows.map(mapCategory);
}

export async function fetchApprovedProducts(options: {
  limit?: number;
  listingType?: string;
  categoryId?: string;
  vendorId?: string;
  featured?: boolean;
} = {}): Promise<PublicProduct[]> {
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    approved: "eq.true",
    order: "created_at.desc",
    limit: String(options.limit || 100),
  });

  if (options.listingType) {
    params.set("listing_type", `eq.${options.listingType}`);
  }

  if (options.categoryId) {
    params.set("category_id", `eq.${options.categoryId}`);
  }

  if (options.vendorId) {
    params.set("vendor_id", `eq.${options.vendorId}`);
  }

  if (options.featured !== undefined) {
    params.set("featured", `eq.${options.featured}`);
  }

  const rows = await supabaseGet<SupabaseProductRow[]>(`products?${params}`);
  return rows.map(mapProduct);
}

export async function fetchApprovedVendorById(id: string): Promise<PublicVendor | null> {
  const params = new URLSearchParams({
    select: VENDOR_SELECT,
    id: `eq.${id}`,
    approved: "eq.true",
    limit: "1",
  });
  const rows = await supabaseGet<SupabaseVendorRow[]>(`vendors?${params}`);
  return rows[0] ? mapVendor(rows[0]) : null;
}

export async function fetchApprovedProductById(id: string): Promise<PublicProduct | null> {
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    id: `eq.${id}`,
    approved: "eq.true",
    limit: "1",
  });
  const rows = await supabaseGet<SupabaseProductRow[]>(`products?${params}`);
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function submitVendorClaim(input: VendorClaimInput) {
  const payload = {
    vendor_id: input.vendorId,
    profile_id: input.profileId || null,
    requester_name: input.requesterName,
    requester_email: input.requesterEmail,
    requester_phone: input.requesterPhone || null,
    requester_designation: input.requesterDesignation || null,
    company_email: input.companyEmail || null,
    company_website: input.companyWebsite || null,
    proof_documents: [],
    message: input.message || null,
    status: "PENDING",
    raw_payload: {
      proof_type: input.proofType || null,
      proof_details: input.proofDetails || null,
      submitted_from: "public_vendor_listing",
    },
  };

  await supabasePostMinimal("vendor_claims", payload, input.accessToken);
}

export async function fetchPublishedBlogs(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<PublicBlog[]> {
  const params = new URLSearchParams({
    select: "id,title,excerpt,content,image_url,created_at,published",
    published: "eq.true",
    order: "created_at.desc",
    limit: String(options.limit || 10),
    offset: String(options.offset || 0),
  });

  const rows = await supabaseGet<SupabaseBlogRow[]>(`blogs?${params}`);
  return rows.map(mapBlog);
}

export async function fetchPublishedBlogById(id: string): Promise<PublicBlog | null> {
  const params = new URLSearchParams({
    select: "id,title,excerpt,content,image_url,created_at,published",
    id: `eq.${id}`,
    published: "eq.true",
    limit: "1",
  });

  const rows = await supabaseGet<SupabaseBlogRow[]>(`blogs?${params}`);
  return rows[0] ? mapBlog(rows[0]) : null;
}

export async function fetchActiveCareers(limit = 100): Promise<PublicCareer[]> {
  const params = new URLSearchParams({
    select: "id,title,department,location,employment_type,description,active,created_at",
    active: "eq.true",
    order: "created_at.desc",
    limit: String(limit),
  });

  const rows = await supabaseGet<SupabaseCareerRow[]>(`careers?${params}`);
  return rows.map(mapCareer);
}

export async function fetchActiveCareerById(id: string): Promise<PublicCareer | null> {
  const params = new URLSearchParams({
    select: "id,title,department,location,employment_type,description,active,created_at",
    id: `eq.${id}`,
    active: "eq.true",
    limit: "1",
  });

  const rows = await supabaseGet<SupabaseCareerRow[]>(`careers?${params}`);
  return rows[0] ? mapCareer(rows[0]) : null;
}
