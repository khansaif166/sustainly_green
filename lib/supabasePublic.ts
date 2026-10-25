type SupabaseVendorRow = {
  id: string;
  slug?: string | null;
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
  vendor?: { slug: string | null } | null;
  vendor_name: string | null;
  title: string | null;
  description: string | null;
  listing_type: string | null;
  category_id: string | null;
  available_for: string[] | null;
  price_type: string | null;
  price: number | string | null;
  currency: string | null;
  moq: number | string | null;
  ship_regions: string[] | null;
  in_stock: boolean | null;
  sustainability_claim: string | null;
  approved: boolean | null;
  featured: boolean | null;
  eco_verified: boolean | null;
  product_images?: Array<{ url: string | null; sort_order: number | null }>;
};

type SupabaseBlogRow = {
  id: string;
  slug: string | null;
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
  slug?: string;
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
  vendorSlug?: string;
  vendorName: string;
  title: string;
  description?: string;
  images: string[];
  listingType?: string;
  availableFor: string[];
  shipRegions: string[];
  inStock: boolean;
  categoryId?: string; 
  priceType?: string;
  price?: number;
  currency: string;
  moq?: number;
  sustainabilityTags: string[];
  tagNames: string[];
  approved: boolean;
  featured: boolean;
  ecoVerified: boolean;
};

export type PublicBlog = {
  id: string;
  title: string;
  excerpt?: string;
  slug?: string;
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
  "slug",
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
  "category_id",
  "price_type",
  "price",
  "currency",
  "moq",
  "ship_regions",
  "in_stock",
  "sustainability_claim",
  "approved",
  "featured",
  "eco_verified",
  "product_images(url,sort_order)",
  "vendor:vendors(slug)",
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
    slug: stringValue(row.slug) || undefined,
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
          ? "verified_supplier"
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
    vendorSlug: stringValue(row.vendor?.slug) || undefined,
    vendorName: stringValue(row.vendor_name) || "Listed Supplier",
    title: stringValue(row.title) || "Untitled Product",
    description: stringValue(row.description) || undefined,
    images,
    listingType: stringValue(row.listing_type) || undefined,
    availableFor: stringArray(row.available_for),
    shipRegions: stringArray(row.ship_regions),
    inStock: row.in_stock !== false,
    categoryId: stringValue(row.category_id) || undefined,   // <-- ADD
    priceType: stringValue(row.price_type) || undefined,
    price: numberValue(row.price),
    currency: stringValue(row.currency) || "INR",
    moq: numberValue(row.moq),
    sustainabilityTags: sustainabilityClaim ? [sustainabilityClaim] : [],
    tagNames: sustainabilityClaim ? [sustainabilityClaim] : [],
    approved: Boolean(row.approved),
    featured: Boolean(row.featured),
    ecoVerified: Boolean(row.eco_verified),
  };
}

function mapBlog(row: SupabaseBlogRow): PublicBlog {
  return {
    id: row.id,
    slug: stringValue(row.slug) || undefined,
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

export async function fetchApprovedVendors(limit = 20_000): Promise<PublicVendor[]> {
  // Supabase caps every response at 1000 rows, so read in pages until done.
  const pageSize = 1000;
  const rows: SupabaseVendorRow[] = [];
  while (rows.length < limit) {
    const params = new URLSearchParams({
      select: VENDOR_SELECT,
      approved: "eq.true",
      order: "company_name.asc,id.asc",
      limit: String(Math.min(pageSize, limit - rows.length)),
      offset: String(rows.length),
    });
    const page = await supabaseGet<SupabaseVendorRow[]>(`vendors?${params}`);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows.map(mapVendor);
}

/* ---------- Paged listings (Browse, Find Vendors) ----------
 * The database does the filtering, sorting and paging, so a page downloads
 * only the rows it shows plus a total count — never the whole table.
 */

export type PagedResult<T> = { items: T[]; total: number };

export type VendorBadgeFilter = "" | "verified" | "approved" | "listed" | "claim_requested";

export type VendorPageQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  badge?: string;
  location?: string;
  sort?: string;
};

export type ProductPageQuery = {
  page?: number;
  pageSize?: number;
  listingType?: string;
  categoryId?: string;
  search?: string;
  ecoVerifiedOnly?: boolean;
  sort?: string;
};

// Splits a search box value into words safe to drop into a PostgREST filter.
// Characters with meaning in the filter syntax are removed, not escaped.
function searchTerms(value: string | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[*%,()"\\:.]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

// Every word has to appear in at least one of the columns.
function everyTermInSomeColumn(terms: string[], columns: string[]) {
  return terms.map((term) => `or(${columns.map((column) => `${column}.ilike.*${term}*`).join(",")})`);
}

function vendorBadgeConditions(badge: string | undefined) {
  const notClaimFlow = "or(claim_status.is.null,claim_status.not.in.(UNCLAIMED,CLAIM_REQUESTED))";
  switch (badge) {
    case "claim_requested": return ["claim_status.eq.CLAIM_REQUESTED"];
    case "listed": return ["claim_status.eq.UNCLAIMED"];
    case "verified": return [notClaimFlow, "listing_verified.is.true"];
    case "approved": return [notClaimFlow, "or(listing_verified.is.null,listing_verified.is.false)"];
    default: return [];
  }
}

async function supabaseGetPage<T>(path: string, offset: number, pageSize: number): Promise<PagedResult<T>> {
  requireSupabaseConfig();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "count=exact",
      "Range-Unit": "items",
      Range: `${offset}-${offset + pageSize - 1}`,
    },
  });

  // 416 = the page is past the end of the results.
  if (response.status === 416) {
    const total = Number(response.headers.get("content-range")?.split("/")[1]);
    return { items: [], total: Number.isFinite(total) ? total : 0 };
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${message}`);
  }

  const total = Number(response.headers.get("content-range")?.split("/")[1]);
  const items = (await response.json()) as T[];
  return { items, total: Number.isFinite(total) ? total : items.length };
}

// Runs a paged query; a page number past the end falls back to the last page.
async function fetchClampedPage<T>(
  path: string,
  page: number,
  pageSize: number,
): Promise<PagedResult<T> & { page: number }> {
  const first = await supabaseGetPage<T>(path, (page - 1) * pageSize, pageSize);
  const lastPage = Math.max(1, Math.ceil(first.total / pageSize));
  if (page <= lastPage) return { ...first, page };
  const last = await supabaseGetPage<T>(path, (lastPage - 1) * pageSize, pageSize);
  return { ...last, page: lastPage };
}

export async function fetchApprovedVendorsPage(
  query: VendorPageQuery = {},
): Promise<PagedResult<PublicVendor> & { page: number }> {
  const pageSize = query.pageSize || 12;
  const page = Math.max(1, Math.floor(query.page || 1));
  const conditions = [
    ...everyTermInSomeColumn(searchTerms(query.search), [
      "company_name", "short_description", "primary_category", "city", "state", "country",
    ]),
    ...everyTermInSomeColumn(searchTerms(query.location), [
      "city", "state", "country", "registered_address",
    ]),
    ...vendorBadgeConditions(query.badge),
  ];
  const params = new URLSearchParams({
    select: VENDOR_SELECT,
    approved: "eq.true",
    order: query.sort === "eco_score"
      ? "eco_score.desc.nullslast,company_name.asc,id.asc"
      : "company_name.asc,id.asc",
  });
  if (conditions.length) params.set("and", `(${conditions.join(",")})`);

  const result = await fetchClampedPage<SupabaseVendorRow>(`vendors?${params}`, page, pageSize);
  return { ...result, items: result.items.map(mapVendor) };
}

export async function fetchApprovedProductsPage(
  query: ProductPageQuery = {},
): Promise<PagedResult<PublicProduct> & { page: number }> {
  const pageSize = query.pageSize || 12;
  const page = Math.max(1, Math.floor(query.page || 1));
  const conditions = everyTermInSomeColumn(searchTerms(query.search), [
    "title", "description", "sustainability_claim",
  ]);
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    approved: "eq.true",
    order: query.sort === "name_az" ? "title.asc,id.asc" : "created_at.desc,id.desc",
  });
  if (query.listingType) params.set("listing_type", `eq.${query.listingType}`);
  if (query.categoryId) params.set("category_id", `eq.${query.categoryId}`);
  if (query.ecoVerifiedOnly) params.set("eco_verified", "is.true");
  if (conditions.length) params.set("and", `(${conditions.join(",")})`);

  const result = await fetchClampedPage<SupabaseProductRow>(`products?${params}`, page, pageSize);
  return { ...result, items: result.items.map(mapProduct) };
}

/** Name and state of just the vendors behind the products on screen. */
export async function fetchVendorSummaries(
  ids: string[],
): Promise<Array<{ id: string; slug?: string; companyName: string; state?: string }>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return [];
  const params = new URLSearchParams({
    select: "id,slug,company_name,state",
    id: `in.(${unique.join(",")})`,
  });
  const rows = await supabaseGet<Array<{ id: string; slug: string | null; company_name: string | null; state: string | null }>>(
    `vendors?${params}`,
  );
  return rows.map((row) => ({
    id: row.id,
    slug: stringValue(row.slug) || undefined,
    companyName: stringValue(row.company_name) || "Unnamed Vendor",
    state: stringValue(row.state) || undefined,
  }));
}

/** Distinct vendor states, for the location filter's suggestions. */
export async function fetchVendorStates(): Promise<string[]> {
  const states = new Set<string>();
  for (let offset = 0; offset < 50_000; offset += 1000) {
    const params = new URLSearchParams({
      select: "state",
      approved: "eq.true",
      state: "not.is.null",
      order: "state.asc,id.asc",
      limit: "1000",
      offset: String(offset),
    });
    const rows = await supabaseGet<Array<{ state: string | null }>>(`vendors?${params}`);
    rows.forEach((row) => { const state = stringValue(row.state); if (state) states.add(state); });
    if (rows.length < 1000) break;
  }
  return Array.from(states).sort((a, b) => a.localeCompare(b));
}

/** Header search-as-you-type: a few matching products and vendors. */
export async function searchSuggestions(
  text: string,
): Promise<{ products: Array<{ id: string; title: string }>; vendors: Array<{ id: string; slug?: string; title: string }> }> {
  const terms = searchTerms(text);
  if (!terms.length) return { products: [], vendors: [] };
  const productParams = new URLSearchParams({
    select: "id,title",
    approved: "eq.true",
    and: `(${terms.map((term) => `title.ilike.*${term}*`).join(",")})`,
    order: "created_at.desc",
    limit: "3",
  });
  const vendorParams = new URLSearchParams({
    select: "id,slug,company_name",
    approved: "eq.true",
    and: `(${terms.map((term) => `company_name.ilike.*${term}*`).join(",")})`,
    order: "company_name.asc",
    limit: "2",
  });
  const [products, vendors] = await Promise.all([
    supabaseGet<Array<{ id: string; title: string | null }>>(`products?${productParams}`).catch(() => []),
    supabaseGet<Array<{ id: string; slug: string | null; company_name: string | null }>>(`vendors?${vendorParams}`).catch(() => []),
  ]);
  return {
    products: products.map((row) => ({ id: row.id, title: stringValue(row.title) || "Untitled Product" })),
    vendors: vendors.map((row) => ({ id: row.id, slug: stringValue(row.slug) || undefined, title: stringValue(row.company_name) || "Unnamed Vendor" })),
  };
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
    order: "created_at.desc,id.desc",
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

  // Supabase caps every response at 1000 rows, so read in pages until done.
  const limit = options.limit || 100;
  const pageSize = 1000;
  const rows: SupabaseProductRow[] = [];
  while (rows.length < limit) {
    params.set("limit", String(Math.min(pageSize, limit - rows.length)));
    params.set("offset", String(rows.length));
    const page = await supabaseGet<SupabaseProductRow[]>(`products?${params}`);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows.map(mapProduct);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Looks a vendor up by its slug (the public URL) or, for old links, its uuid. */
export async function fetchApprovedVendorById(idOrSlug: string): Promise<PublicVendor | null> {
  const value = decodeURIComponent(idOrSlug).trim();
  const params = new URLSearchParams({
    select: VENDOR_SELECT,
    approved: "eq.true",
    limit: "1",
  });
  if (UUID_PATTERN.test(value)) params.set("id", `eq.${value}`);
  else params.set("slug", `eq.${value.toLowerCase()}`);
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
    select: BLOG_SELECT,
    published: "eq.true",
    order: "created_at.desc",
    limit: String(options.limit || 10),
    offset: String(options.offset || 0),
  });

  const rows = await supabaseGet<SupabaseBlogRow[]>(`blogs?${params}`);
  return rows.map(mapBlog);
}

// `slug` must stay in this list: blogHref(), the page canonical and
// sitemap-blog.xml all depend on it, and dropping it 404s every slug URL.
const BLOG_SELECT = "id,slug,title,excerpt,content,image_url,created_at,published";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a blog from the /blogs/[id] segment, which may be either the row
 * UUID (the original URL form, still live and still linked) or the slug (the
 * form used for posts published from 2026-09 onward). UUID-shaped segments are
 * looked up by id; everything else by slug. Sending a slug to `id=eq.` makes
 * Postgres reject it as an invalid uuid, which the page renders as not-found.
 */
export async function fetchPublishedBlogById(
  idOrSlug: string,
): Promise<PublicBlog | null> {
  const params = new URLSearchParams({
    select: BLOG_SELECT,
    published: "eq.true",
    limit: "1",
  });
  params.set(UUID_RE.test(idOrSlug) ? "id" : "slug", `eq.${idOrSlug}`);

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
