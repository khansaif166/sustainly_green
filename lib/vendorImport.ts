// Shared fields, validation and storage mapping for manual vendor creation
// and the admin Excel import.

export const REQUIRED_COLUMNS = [
  "Logo",
  "Company Name",
  "Categories",
  "Products/ Services",
  "Address",
  "State",
  "Operating Hours",
  "Business Description",
] as const;

type OptionalKey =
  | "industry"
  | "website"
  | "brand"
  | "tagline"
  | "productOfferings"
  | "linkedin"
  | "sustainability"
  | "mapLink"
  | "rating";

// Optional columns: older 8-column files still import. A header matches when
// its letters/digits (lower-cased) start with one of the prefixes, so
// "LinkedIn Company Page", "LinkedIn Company URL" and "Linkedin" all work.
export const OPTIONAL_COLUMNS: Array<{ key: OptionalKey; label: string; prefixes: string[] }> = [
  { key: "industry", label: "Industry", prefixes: ["industry"] },
  { key: "website", label: "Website", prefixes: ["website", "companywebsite"] },
  { key: "brand", label: "Brand", prefixes: ["brand"] },
  { key: "tagline", label: "Tagline", prefixes: ["tagline"] },
  { key: "productOfferings", label: "Product Offerings", prefixes: ["productof"] },
  { key: "linkedin", label: "LinkedIn Company Page", prefixes: ["linkedin"] },
  { key: "sustainability", label: "Sustainability", prefixes: ["sustainab"] },
  { key: "mapLink", label: "Map Link", prefixes: ["maplink", "map", "googlemap", "location link"] },
  { key: "rating", label: "Ratings", prefixes: ["rating"] },
];

export const VENDOR_REQUIRED_FIELDS = [
  { key: "logo", label: "Logo", required: false },
  { key: "companyName", label: "Company Name", required: true },
  { key: "categories", label: "Categories", required: true },
  { key: "products", label: "Products/ Services", required: true },
  { key: "address", label: "Address", required: true },
  { key: "state", label: "State", required: true },
  { key: "operatingHours", label: "Operating Hours", required: true },
  { key: "description", label: "Business Description", required: true },
] as const;

export type VendorFieldKey = (typeof VENDOR_REQUIRED_FIELDS)[number]["key"] | OptionalKey;
export type VendorFieldErrors = Partial<Record<VendorFieldKey, string>>;

/** Every column the downloadable template contains, in order. */
export const TEMPLATE_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS.map((c) => c.label)];

export const TEMPLATE_EXAMPLE_ROW = [
  "https://example.com/logo.png",
  "Example Green Company",
  "Renewable Energy, Solar",
  "Solar panels; Installation",
  "12 Example Road",
  "Karnataka",
  "Mon-Sat, 9:00 AM-6:00 PM",
  "Sustainable energy products and services.",
  "Renewable Energy",
  "https://example.com",
  "ExampleSolar",
  "Clean power for every rooftop",
  "Rooftop solar, Solar water heaters",
  "https://www.linkedin.com/company/example",
  "ISO 14001 certified; 100% recycled packaging",
  "https://maps.google.com/?q=Example+Green+Company",
  "4.5",
];

export const MAX_IMPORT_ROWS = 1_000;

export function clean(value: unknown) {
  return value == null ? "" : String(value).trim().replace(/\s+/g, " ");
}

function headerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function list(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Accepts "example.com" / "www.example.com" and adds https://. */
function normalizeUrl(value: string): string | null {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Accepts "4.5", "4.5/5", "4.5 stars"; must land between 0 and 5. */
function parseRating(value: string): number | null | undefined {
  if (!value) return null;
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  const rating = match ? Number(match[0]) : NaN;
  return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? Math.round(rating * 10) / 10 : undefined;
}

export function vendorKey(companyName: string, address: string, state: string) {
  return [companyName, address, state].map((value) => clean(value).toLocaleLowerCase()).join("|");
}

export type ParsedVendorRow = {
  excelRow: number;
  key: string;
  companyName: string;
  logo: string;
  categories: string[];
  products: string[];
  address: string;
  state: string;
  operatingHours: string;
  description: string;
  extra: {
    industry: string | null;
    website: string | null;
    brand: string | null;
    tagline: string | null;
    productOfferings: string | null;
    linkedin: string | null;
    sustainability: string | null;
    mapLink: string | null;
    rating: number | null;
  };
};

export function validateVendorFields(input: Record<string, unknown>) {
  const fieldErrors: VendorFieldErrors = {};
  const get = (key: VendorFieldKey) => {
    const value = input[key];
    if (value != null && typeof value !== "string" && !(key === "rating" && typeof value === "number")) {
      fieldErrors[key] = "Enter a text value.";
      return "";
    }
    return clean(value);
  };
  const fields = Object.fromEntries(
    [...VENDOR_REQUIRED_FIELDS, ...OPTIONAL_COLUMNS].map(({ key }) => [key, get(key)]),
  ) as Record<VendorFieldKey, string>;
  for (const field of VENDOR_REQUIRED_FIELDS) {
    if (field.required && !fields[field.key]) fieldErrors[field.key] = `${field.label} is required.`;
  }
  const categories = list(fields.categories);
  const products = list(fields.products);
  if (fields.categories && !categories.length) fieldErrors.categories = "Enter at least one category.";
  if (fields.products && !products.length) fieldErrors.products = "Enter at least one product or service.";
  if (fields.logo && (!/^https?:\/\/\S+$/i.test(fields.logo) || !normalizeUrl(fields.logo))) {
    fieldErrors.logo = "Logo must be a valid http(s) image URL.";
  }
  const urlField = (key: "website" | "linkedin" | "mapLink", label: string) => {
    const url = normalizeUrl(fields[key]);
    if (fields[key] && !url) fieldErrors[key] = `${label} must be a valid link.`;
    return url;
  };
  const website = urlField("website", "Website");
  const linkedin = urlField("linkedin", "LinkedIn");
  const mapLink = urlField("mapLink", "Map Link");
  const rating = parseRating(fields.rating);
  if (rating === undefined) fieldErrors.rating = "Ratings must be a number from 0 to 5.";

  const vendor: Omit<ParsedVendorRow, "excelRow"> = {
    key: vendorKey(fields.companyName, fields.address, fields.state),
    companyName: fields.companyName,
    logo: fields.logo,
    categories,
    products,
    address: fields.address,
    state: fields.state,
    operatingHours: fields.operatingHours,
    description: fields.description,
    extra: {
      industry: fields.industry || null,
      website,
      brand: fields.brand || null,
      tagline: fields.tagline || null,
      productOfferings: fields.productOfferings || null,
      linkedin,
      sustainability: fields.sustainability || null,
      mapLink,
      rating: rating ?? null,
    },
  };
  return { vendor, fieldErrors };
}

export function vendorListingRecord(row: Omit<ParsedVendorRow, "excelRow">) {
  return {
    company_name: row.companyName,
    logo_url: row.logo || null,
    primary_category: row.categories[0] || null,
    sub_categories: row.categories.slice(1),
    key_products: row.products,
    registered_address: row.address || null,
    state: row.state || null,
    country: "India",
    short_description: row.description || null,
    public_contact: Object.fromEntries(
      Object.entries({ operatingHours: row.operatingHours || null, ...row.extra })
        .filter(([, value]) => value !== null && value !== ""),
    ),
    claim_status: "UNCLAIMED",
    approved: true,
    status: "approved",
    listing_verified: false,
  };
}

export type SheetParseResult =
  | { ok: false; columnError: string }
  | { ok: true; rows: ParsedVendorRow[]; rowErrors: Array<{ row: number; message: string }> };

/**
 * Validates a sheet given as rows of cells (first row = headers), as produced
 * by XLSX.utils.sheet_to_json(sheet, { header: 1 }).
 */
export function parseVendorSheet(sheetRows: unknown[][]): SheetParseResult {
  const headers = (sheetRows[0] || []).map(clean);
  const keys = headers.map(headerKey);

  const requiredIndex = new Map<string, number>();
  for (const column of REQUIRED_COLUMNS) {
    const index = keys.indexOf(headerKey(column));
    if (index !== -1) requiredIndex.set(column, index);
  }
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !requiredIndex.has(column));

  const optionalIndex = new Map<OptionalKey, number>();
  const unknownColumns: string[] = [];
  headers.forEach((header, index) => {
    if (!header || [...requiredIndex.values()].includes(index)) return;
    const match = OPTIONAL_COLUMNS.find((column) =>
      column.prefixes.some((prefix) => keys[index].startsWith(headerKey(prefix))),
    );
    if (match && !optionalIndex.has(match.key)) optionalIndex.set(match.key, index);
    else unknownColumns.push(header);
  });

  if (missingColumns.length || unknownColumns.length) {
    const parts = [];
    if (missingColumns.length) parts.push(`Missing required column${missingColumns.length === 1 ? "" : "s"}: ${missingColumns.join(", ")}.`);
    if (unknownColumns.length) parts.push(`Unrecognised column${unknownColumns.length === 1 ? "" : "s"}: ${unknownColumns.join(", ")}.`);
    parts.push("Download the template to see the accepted columns.");
    return { ok: false, columnError: parts.join(" ") };
  }

  const cell = (row: unknown[], index: number | undefined) => (index === undefined ? "" : clean(row[index]));
  const rowErrors: Array<{ row: number; message: string }> = [];
  const seen = new Map<string, number>();
  const rows: ParsedVendorRow[] = [];

  sheetRows.slice(1).forEach((row, i) => {
    if (!row.some((value) => clean(value))) return;
    const excelRow = i + 2;
    const get = (column: (typeof REQUIRED_COLUMNS)[number]) => cell(row, requiredIndex.get(column));
    const opt = (key: OptionalKey) => cell(row, optionalIndex.get(key));

    const { vendor, fieldErrors } = validateVendorFields(Object.fromEntries([
      ...VENDOR_REQUIRED_FIELDS.map((field) => [field.key, get(field.label)]),
      ...OPTIONAL_COLUMNS.map((field) => [field.key, opt(field.key)]),
    ]));
    for (const message of Object.values(fieldErrors)) rowErrors.push({ row: excelRow, message });

    const key = vendor.key;
    const firstRow = seen.get(key);
    if (firstRow) rowErrors.push({ row: excelRow, message: `Duplicate of row ${firstRow}.` });
    else seen.set(key, excelRow);

    rows.push({ ...vendor, excelRow });
  });

  return { ok: true, rows, rowErrors };
}
