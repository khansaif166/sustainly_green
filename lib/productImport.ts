// Shared by the spreadsheet preview and authenticated import API.
export const MAX_IMPORT_ROWS = 100;
export const MAX_SPREADSHEET_BYTES = 10 * 1024 * 1024;
export const IMPORT_COLUMNS = [
  "title", "description", "listing_type", "category_slug", "subcategory_name",
  "available_for", "price_type", "price", "currency", "moq", "discount",
  "ship_regions", "in_stock", "sustainability_tags", "sustainability_claim",
  "image_1", "image_2", "image_3", "image_4", "image_5",
] as const;
export const REQUIRED_IMPORT_COLUMNS = ["title", "listing_type", "category_slug", "price_type"];
export type ImportColumn = typeof IMPORT_COLUMNS[number];
export type ImportFields = Partial<Record<ImportColumn, string>>;
export type ImportCatalog = {
  categories: Array<{ id: string; name: string; slug: string }>;
  subcategories: Array<{ id: string; name: string; categoryId: string }>;
  tags: Array<{ id: string; name: string }>;
};
export type ImportProduct = {
  title: string; description: string; listingType: string;
  categoryId: string; subCategoryId: string | null;
  availableFor: string[]; priceType: string; price: number | null;
  currency: string; moq: number | null; discount: string;
  shipRegions: string[]; inStock: boolean;
  sustainabilityTagIds: string[]; sustainabilityClaim: string;
};
export type ImportIssue = { field: string; message: string };
export type ImportImageManifest = { name: string; type: string; size: number; sha256: string };
export type ImportReceipt = {
  state: "prepared" | "created" | "aborted";
  attemptId: string;
  productId: string | null;
  images: Array<{ path: string; url: string }>;
};
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const key = (value: string) => value.trim().toLowerCase();

export function validateImportFields(fields: ImportFields, catalog: ImportCatalog) {
  const issues: ImportIssue[] = [];
  const issue = (field: string, message: string) => issues.push({ field, message });
  function text(field: ImportColumn, max: number, required = false) {
    const value = (fields[field] ?? "").trim();
    if (required && !value) issue(field, "Required.");
    if (value.length > max) issue(field, `Use at most ${max} characters.`);
    return value;
  }
  function choice(field: ImportColumn, options: string[], required = false) {
    const value = text(field, 100, required);
    const found = options.find(option => key(option) === key(value));
    if (value && !found) issue(field, `Choose ${options.join(", ")}.`);
    return found ?? "";
  }
  function list(field: ImportColumn, options?: string[]) {
    const values = text(field, 1000).split(";").map(value => value.trim()).filter(Boolean);
    if (!options) return values;
    const normalized = values.map(value => options.find(option => key(option) === key(value)));
    if (normalized.some(value => !value)) issue(field, `Separate these values with semicolons: ${options.join(", ")}.`);
    return [...new Set(normalized.filter((value): value is string => Boolean(value)))];
  }
  function number(field: "price" | "moq", required = false) {
    const value = text(field, 40, required);
    if (!value) return null;
    if (!/^\d+(\.\d{1,2})?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) > 999999999999.99) {
      issue(field, "Use a nonnegative number with at most two decimal places, without currency symbols or commas.");
      return null;
    }
    return Number(value);
  }
  const title = text("title", 200, true);
  const description = text("description", 500);
  const listingType = choice("listing_type", ["Product", "Service"], true);
  const categorySlug = text("category_slug", 200, true);
  const categories = catalog.categories.filter(category => key(category.slug) === key(categorySlug));
  if (categorySlug && categories.length !== 1) issue("category_slug", "Use an active, unambiguous category slug from the catalog reference.");
  const categoryId = categories.length === 1 ? categories[0].id : "";
  const subcategoryName = text("subcategory_name", 200);
  const subcategories = catalog.subcategories.filter(subcategory => subcategory.categoryId === categoryId && key(subcategory.name) === key(subcategoryName));
  if (subcategoryName && subcategories.length !== 1) issue("subcategory_name", "Use an active, unambiguous subcategory belonging to the selected category.");
  const priceType = choice("price_type", ["Fixed Price", "Starts From", "Price on Request"], true);
  const price = number("price", Boolean(priceType && priceType !== "Price on Request"));
  const moq = number("moq");
  const currency = text("currency", 3).toUpperCase() || "INR";
  if (!/^[A-Z]{3}$/.test(currency)) issue("currency", "Use a three-letter currency code, such as INR.");
  const availableFor = list("available_for", ["B2B", "B2C"]);
  const shipRegions = list("ship_regions", ["Local Only", "Countrywide", "Regional", "Worldwide"]);
  const inStock = choice("in_stock", ["TRUE", "FALSE"]) || "TRUE";
  const tagNames = list("sustainability_tags");
  if (tagNames.length > 3) issue("sustainability_tags", "Choose at most three tags.");
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const matches = catalog.tags.filter(tag => key(tag.name) === key(name));
    if (matches.length !== 1) issue("sustainability_tags", `Unknown or ambiguous active tag: ${name}.`);
    else if (tagIds.includes(matches[0].id)) issue("sustainability_tags", `Duplicate tag: ${name}.`);
    else tagIds.push(matches[0].id);
  }
  const imageNames = Array.from({ length: 5 }, (_, index) => text(`image_${index + 1}` as ImportColumn, 255)).filter(Boolean);
  for (const name of imageNames) {
    if (/[\\/]/.test(name)) issue("images", "Use local filenames only, without URLs or folder paths.");
    if (imageNames.filter(value => value === name).length > 1) issue("images", `Duplicate image filename: ${name}.`);
  }
  const product: ImportProduct = {
    title, description, listingType, categoryId,
    subCategoryId: subcategoryName && subcategories.length === 1 ? subcategories[0].id : null,
    availableFor, priceType, price, currency, moq,
    discount: text("discount", 200), shipRegions, inStock: inStock !== "FALSE",
    sustainabilityTagIds: tagIds, sustainabilityClaim: text("sustainability_claim", 1000),
  };
  return { product, imageNames, issues };
}

export function matchImportImages(names: string[], files: File[]) {
  const matched: File[] = [];
  const issues: ImportIssue[] = [];
  for (const name of names) {
    const matches = files.filter(file => file.name === name);
    if (matches.length !== 1) issues.push({ field: "images", message: matches.length ? `More than one selected file is named ${name}. Select it only once.` : `Select the image file ${name}.` });
    else matched.push(matches[0]);
  }
  return { files: matched, issues };
}

export function csvCell(value: string) {
  // Prevent spreadsheet formula injection in exports containing user input.
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function importCsv(rows: ImportFields[], errors?: string[]) {
  const headers = [...IMPORT_COLUMNS, ...(errors ? ["import_error"] : [])];
  return "\uFEFF" + [headers.map(csvCell).join(","), ...rows.map((row, index) => [...IMPORT_COLUMNS.map(column => row[column] ?? ""), ...(errors ? [errors[index] ?? ""] : [])].map(csvCell).join(","))].join("\r\n");
}
