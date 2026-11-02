import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { csvCell, importCsv, matchImportImages, validateImportFields, type ImportCatalog, type ImportFields, type ImportReceipt } from "../lib/productImport";
import { parseProductSpreadsheet, productImportWorkbook } from "../lib/productImportSpreadsheet";
import { executeImportRow, runImportQueue, type ImportWorkflow } from "../lib/productImportWorkflow";

const catalog: ImportCatalog = {
  categories: [{ id: "cat-1", name: "Packaging", slug: "packaging" }, { id: "cat-2", name: "Other", slug: "other" }],
  subcategories: [{ id: "sub-1", name: "Bottles", categoryId: "cat-1" }, { id: "sub-2", name: "Consulting", categoryId: "cat-2" }],
  tags: [{ id: "tag-1", name: "Recycled" }, { id: "tag-2", name: "Reusable" }],
};
const fields: ImportFields = { title: "Bamboo Bottle", listing_type: "Product", category_slug: "packaging", price_type: "Fixed Price", price: "350" };
const validate = (patch: ImportFields) => validateImportFields({ ...fields, ...patch }, catalog);

test("valid product fields normalize enums, defaults, names and list values", () => {
  const result = validate({ listing_type: "product", subcategory_name: "bottles", available_for: "b2b;B2C", ship_regions: "countrywide;Worldwide", sustainability_tags: "recycled;Reusable" });
  assert.deepEqual(result.issues, []);
  assert.equal(result.product.categoryId, "cat-1");
  assert.equal(result.product.subCategoryId, "sub-1");
  assert.deepEqual(result.product.sustainabilityTagIds, ["tag-1", "tag-2"]);
  assert.equal(result.product.currency, "INR");
  assert.equal(result.product.inStock, true);
  assert.deepEqual(result.product.availableFor, ["B2B", "B2C"]);
});

test("required fields and price rules reject incomplete rows", () => {
  for (const field of ["title", "listing_type", "category_slug", "price_type", "price"] as const) assert(validate({ [field]: "" }).issues.some(issue => issue.field === field));
  for (const price of ["-1", "NaN", "₹300", "1,000", "1.234", "1e4", "1000000000000"]) assert(validate({ price }).issues.some(issue => issue.field === "price"));
  assert.equal(validate({ price: "0" }).issues.length, 0);
  assert.equal(validate({ price_type: "Price on Request", price: "" }).issues.length, 0);
  assert.equal(validate({ listing_type: "Service", price_type: "Starts From", price: "25.50" }).issues.length, 0);
});

test("category/subcategory/tag validation prevents mismatches and ambiguity", () => {
  assert(validate({ category_slug: "inactive" }).issues.some(issue => issue.field === "category_slug"));
  assert(validate({ subcategory_name: "Consulting" }).issues.some(issue => issue.field === "subcategory_name"));
  assert(validate({ sustainability_tags: "Missing" }).issues.length);
  assert(validate({ sustainability_tags: "Recycled;recycled" }).issues.length);
  const ambiguous = { ...catalog, subcategories: [...catalog.subcategories, catalog.subcategories[0]], tags: [...catalog.tags, catalog.tags[0]] };
  assert(validateImportFields({ ...fields, subcategory_name: "Bottles", sustainability_tags: "Recycled" }, ambiguous).issues.length >= 2);
});

test("unsupported enums, long text, currencies, stock and image paths are rejected", () => {
  for (const patch of [{ listing_type: "Variant" }, { in_stock: "maybe" }, { currency: "USDT" }, { available_for: "B2G" }, { ship_regions: "Moon" }, { description: "x".repeat(501) }, { image_1: "https://example.test/photo.png" }, { image_1: "same.png", image_2: "same.png" }]) assert(validate(patch).issues.length);
});

test("local photos match exactly and duplicate filenames are not guessed", () => {
  const photo = new File(["bytes"], "photo.png", { type: "image/png" });
  assert.equal(matchImportImages(["photo.png"], [photo]).files.length, 1);
  assert.equal(matchImportImages(["PHOTO.png"], [photo]).issues.length, 1);
  assert.equal(matchImportImages(["photo.png"], [photo, photo]).issues.length, 1);
  assert.equal(matchImportImages([], []).issues.length, 0);
});

function csvBuffer(value: string) { return new TextEncoder().encode(value).buffer as ArrayBuffer; }
function workbookBuffer(sheet: XLSX.WorkSheet) {
  const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Products");
  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

test("CSV parsing preserves quotes, multiline descriptions, Unicode and leading zeros", () => {
  const data = 'title,description,listing_type,category_slug,price_type,price\r\n"001 Bottle","Sustainable, reusable\nनमस्ते",Product,packaging,Fixed Price,350';
  const [row] = parseProductSpreadsheet(csvBuffer(data), "products.csv");
  assert.equal(row.fields.title, "001 Bottle");
  assert.equal(row.fields.description, "Sustainable, reusable\nनमस्ते");
  assert.equal(row.sheetRow, 2);
});

test("CSV rejects unknown/duplicate headers, missing columns and empty sheets", () => {
  for (const data of ["", "title\nBottle", "title,title,listing_type,category_slug,price_type\nx,x,Product,packaging,Fixed Price", "title,listing_type,category_slug,price_type,approved\nx,Product,packaging,Price on Request,true"]) assert.throws(() => parseProductSpreadsheet(csvBuffer(data), "products.csv"));
  assert.throws(() => parseProductSpreadsheet(csvBuffer(""), "products.xlsm"));
  assert.throws(() => parseProductSpreadsheet(new ArrayBuffer(10 * 1024 * 1024 + 1), "products.xlsx"));
});

test("XLSX formulas are flagged even with cached values and leading blank rows", () => {
  const sheet = XLSX.utils.aoa_to_sheet([[], [], ["title", "listing_type", "category_slug", "price_type"], ["Bottle", "Product", "packaging", "Price on Request"]]);
  sheet.A4 = { t: "s", v: "Cached", f: 'CONCAT("Bot","tle")' };
  const [row] = parseProductSpreadsheet(workbookBuffer(sheet), "products.xlsx");
  assert.equal(row.sheetRow, 4);
  assert(row.issues.some(issue => issue.includes("Formula")));
});

test("100 nonempty rows are allowed; 101 are rejected without silent truncation", () => {
  const row = { ...fields, price: "350" };
  assert.equal(parseProductSpreadsheet(csvBuffer(importCsv(Array.from({ length: 100 }, () => row))), "products.csv").length, 100);
  assert.throws(() => parseProductSpreadsheet(csvBuffer(importCsv(Array.from({ length: 101 }, () => row))), "products.csv"), /at most 100/);
});

test("templates round-trip and error exports neutralize spreadsheet formulas", () => {
  const workbook = productImportWorkbook(catalog);
  assert.equal(parseProductSpreadsheet(workbook.data, "template.xlsx").length, 2);
  assert.equal(parseProductSpreadsheet(csvBuffer(importCsv([fields], ["Correct photo"])), "failed.csv").length, 1);
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
});

const receipt: ImportReceipt = { state: "prepared", attemptId: "attempt", productId: null, images: [{ path: "photo", url: "url" }] };
function workflow(patch: Partial<ImportWorkflow> = {}) {
  const calls: string[] = [];
  return { calls, api: {
    check: async () => { calls.push("check"); return { state: "missing" }; },
    prepare: async () => { calls.push("prepare"); return receipt; },
    upload: async () => { calls.push("upload"); },
    commit: async () => { calls.push("commit"); return { state: "created", productId: "product" }; },
    abort: async () => { calls.push("abort"); return { state: "aborted" }; },
    stage: () => {}, ...patch,
  } satisfies ImportWorkflow };
}

test("import workflow creates a row in the required order", async () => {
  const { api, calls } = workflow();
  assert.deepEqual(await executeImportRow(api), { state: "created", productId: "product" });
  assert.deepEqual(calls, ["check", "prepare", "upload", "commit"]);
});

test("lost commit response keeps uploaded images and retry returns the existing product", async () => {
  const first = workflow({ commit: async () => { throw new Error("Timeout"); } });
  assert.equal((await executeImportRow(first.api)).state, "uncertain");
  assert(!first.calls.includes("abort"));
  const retry = workflow({ check: async () => ({ state: "created", productId: "same-product" }) });
  assert.deepEqual(await executeImportRow(retry.api, true), { state: "created", productId: "same-product" });
  assert.deepEqual(retry.calls, []);
});

test("upload failure aborts only its attempt and never calls commit", async () => {
  const row = workflow({ upload: async () => { throw new Error("Storage offline"); } });
  const result = await executeImportRow(row.api);
  assert.equal(result.state, "failed");
  assert(row.calls.includes("abort"));
  assert(!row.calls.includes("commit"));
});

test("an unresolved prior commit remains uncertain if a later check fails", async () => {
  const row = workflow({ check: async () => { throw new Error("Session expired"); } });
  assert.equal((await executeImportRow(row.api, true)).state, "uncertain");
  assert.equal((await executeImportRow(row.api, false)).state, "failed");
});

test("queue caps concurrency at two rows and processes every row once", async () => {
  let active = 0, maximum = 0;
  const completed: number[] = [];
  await runImportQueue([1, 2, 3, 4, 5], async value => {
    maximum = Math.max(maximum, ++active);
    await new Promise(resolve => setTimeout(resolve, 2));
    completed.push(value); active--;
  });
  assert.equal(maximum, 2);
  assert.deepEqual(completed.sort(), [1, 2, 3, 4, 5]);
});
