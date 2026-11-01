import * as XLSX from "xlsx";
import { IMPORT_COLUMNS, MAX_IMPORT_ROWS, MAX_SPREADSHEET_BYTES, REQUIRED_IMPORT_COLUMNS, type ImportCatalog, type ImportColumn, type ImportFields } from "./productImport";

export function parseProductSpreadsheet(data: ArrayBuffer, filename: string) {
  if (!/\.(csv|xlsx)$/i.test(filename)) throw new Error("Choose a CSV or XLSX file.");
  if (data.byteLength > MAX_SPREADSHEET_BYTES) throw new Error("The spreadsheet must be 10 MB or smaller.");
  const csv = /\.csv$/i.test(filename);
  let input: ArrayBuffer | string = data;
  if (csv) {
    try { input = new TextDecoder("utf-8", { fatal: true }).decode(data); }
    catch { throw new Error("Save the CSV using UTF-8 encoding, or upload an XLSX workbook."); }
  }
  const book = XLSX.read(input, { type: csv ? "string" : "array", raw: true, cellFormula: true, cellHTML: false, cellStyles: false, sheetRows: 10002 });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet?.["!ref"]) throw new Error("The first worksheet is empty.");
  const range = XLSX.utils.decode_range(sheet["!fullref"] ?? sheet["!ref"]);
  if (range.e.r > 10000 || range.e.c > 63) throw new Error("Remove excess worksheet rows/columns. Use the template with at most 100 products.");
  const usedRange = XLSX.utils.decode_range(sheet["!ref"]);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true, blankrows: true, range: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: usedRange.e }) });
  const headerIndex = rows.findIndex(row => row.some(value => String(value).trim()));
  if (headerIndex < 0) throw new Error("The first worksheet is empty.");
  const headers = rows[headerIndex].map(value => String(value).trim().toLowerCase());
  if (headers.some((_, column) => sheet[XLSX.utils.encode_cell({ r: headerIndex, c: column })]?.f)) throw new Error("Use plain column headers, without formulas.");
  const supported = [...IMPORT_COLUMNS, "import_error"];
  const unknown = headers.filter(header => header && !supported.includes(header));
  if (unknown.length) throw new Error(`Unsupported columns: ${unknown.join(", ")}. Use the product template.`);
  if (headers.some((header, index) => header && headers.indexOf(header) !== index)) throw new Error("Each column header must appear only once.");
  const missing = REQUIRED_IMPORT_COLUMNS.filter(header => !headers.includes(header));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}.`);
  const result: Array<{ sheetRow: number; fields: ImportFields; issues: string[] }> = [];
  for (let index = headerIndex + 1; index < rows.length; index++) {
    if (!rows[index].some(value => String(value).trim())) continue;
    if (result.length === MAX_IMPORT_ROWS) throw new Error("A batch can contain at most 100 nonempty product rows. Split this sheet into smaller batches.");
    const fields: ImportFields = {};
    const issues: string[] = [];
    for (let column = 0; column < Math.max(headers.length, rows[index].length); column++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: index, c: column })];
      if (cell?.f) issues.push("Formula cells are not supported. Replace formulas with plain values.");
      const value = String(rows[index][column] ?? "");
      if (!headers[column] && value.trim()) issues.push("A populated column has no header.");
      if (IMPORT_COLUMNS.includes(headers[column] as ImportColumn)) fields[headers[column] as ImportColumn] = value;
    }
    result.push({ sheetRow: index + 1, fields, issues: [...new Set(issues)] });
  }
  if (!result.length) throw new Error("The sheet has headers but no product rows.");
  return result;
}

export function productImportWorkbook(catalog: ImportCatalog) {
  const examples: ImportFields[] = [
    { title: "Bamboo Bottle", description: "Reusable bottle", listing_type: "Product", category_slug: catalog.categories[0]?.slug ?? "replace-with-category-slug", price_type: "Fixed Price", price: "350", currency: "INR", in_stock: "TRUE", available_for: "B2B", image_1: "bottle.jpg" },
    { title: "Consulting Service", listing_type: "Service", category_slug: catalog.categories[0]?.slug ?? "replace-with-category-slug", price_type: "Price on Request", currency: "INR", in_stock: "TRUE" },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([Array.from(IMPORT_COLUMNS), ...examples.map(row => IMPORT_COLUMNS.map(column => row[column] ?? ""))]), "Products");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ["Instructions"], ["Replace the sample rows. Only the first worksheet is imported. Maximum 100 products, 10 MB spreadsheet."],
    ["Required: title, listing_type, category_slug, price_type. Price is required for Fixed Price and Starts From."],
    ["listing_type: Product; Service. price_type: Fixed Price; Starts From; Price on Request."],
    ["Use plain numbers without commas/currency symbols. At most two decimal places. Currency defaults to INR."],
    ["available_for: B2B;B2C. ship_regions: Local Only;Countrywide;Regional;Worldwide. Use semicolons between values."],
    ["in_stock: TRUE or FALSE; defaults to TRUE. Tags: up to 3 exact catalog names separated by semicolons."],
    ["image_1 through image_5: exact local filenames, case-sensitive. Select the matching image files alongside the sheet. Images are optional."],
    ["First image is the cover; you can crop and change the cover in preview. Photos are optimized before upload."],
    ["Subcategory names must belong to the selected category. Use Catalog for active slugs, names and tags."],
    ["Create only: no existing product updates. One vendor per batch. Vendor products are pending review; admin products are approved."],
    ["Keep the page open until results are resolved. Retry failed/uncertain rows here to avoid duplicates. Reloading starts a new batch."],
    ["No formulas, macros, remote image URLs, vendor IDs, approval fields or specification columns."],
  ]), "Instructions");
  const reference = [["Type", "Name", "Category slug"],
    ...catalog.categories.map(category => ["Category", category.name, category.slug]),
    ...catalog.subcategories.map(subcategory => ["Subcategory", subcategory.name, catalog.categories.find(category => category.id === subcategory.categoryId)?.slug ?? ""]),
    ...catalog.tags.map(tag => ["Sustainability tag", tag.name, ""]),
  ];
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(reference), "Catalog");
  return { examples, data: XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer };
}
