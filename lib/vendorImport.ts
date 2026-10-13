// Column rules for the admin "Import vendors" Excel upload. Shared by the
// browser pre-check (admin/vendors page) and the server import route so the
// two can never disagree about what a valid sheet is.

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
  const match = value.replace(",", ".").match(/\d+(\.\d+)?/);
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

    const missing = REQUIRED_COLUMNS.filter((column) => column !== "Logo" && !get(column));
    if (missing.length) rowErrors.push({ row: excelRow, message: `Missing ${missing.join(", ")}.` });

    const logo = get("Logo");
    if (logo && !/^https?:\/\/\S+$/i.test(logo)) {
      rowErrors.push({ row: excelRow, message: "Logo must be a valid http(s) image URL." });
    }

    const urlField = (key: "website" | "linkedin" | "mapLink", label: string) => {
      const raw = opt(key);
      const url = normalizeUrl(raw);
      if (raw && !url) rowErrors.push({ row: excelRow, message: `${label} must be a valid link.` });
      return url;
    };
    const website = urlField("website", "Website");
    const linkedin = urlField("linkedin", "LinkedIn");
    const mapLink = urlField("mapLink", "Map Link");
    const rating = parseRating(opt("rating"));
    if (rating === undefined) rowErrors.push({ row: excelRow, message: "Ratings must be a number from 0 to 5." });

    const key = vendorKey(get("Company Name"), get("Address"), get("State"));
    const firstRow = seen.get(key);
    if (firstRow) rowErrors.push({ row: excelRow, message: `Duplicate of row ${firstRow}.` });
    else seen.set(key, excelRow);

    rows.push({
      excelRow,
      key,
      companyName: get("Company Name"),
      logo,
      categories: list(get("Categories")),
      products: list(get("Products/ Services")),
      address: get("Address"),
      state: get("State"),
      operatingHours: get("Operating Hours"),
      description: get("Business Description"),
      extra: {
        industry: opt("industry") || null,
        website,
        brand: opt("brand") || null,
        tagline: opt("tagline") || null,
        productOfferings: opt("productOfferings") || null,
        linkedin,
        sustainability: opt("sustainability") || null,
        mapLink,
        rating: rating ?? null,
      },
    });
  });

  return { ok: true, rows, rowErrors };
}
