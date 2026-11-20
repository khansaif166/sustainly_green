import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const plain = (value) => JSON.parse(JSON.stringify(value));
const fields = {
  companyName: "Example Green Company",
  categories: "Renewable Energy, Solar",
  products: "Solar panels; Installation",
  address: "12 Example Road",
  state: "Karnataka",
  operatingHours: "Mon-Sat, 9:00 AM-6:00 PM",
  description: "Sustainable energy products and services.",
};

// Execute the real routes, auth checks and public reader with an isolated
// Supabase HTTP fixture. No credentials or external database are needed.
function fixture() {
  const vendors = [];
  const calls = [];
  const cache = new Map();
  let failInsert = false;
  const context = vm.createContext({
    URL, URLSearchParams, Request, Response, File, FormData, Uint8Array,
    AbortSignal, setTimeout,
    process: { env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon",
      SUPABASE_SERVICE_ROLE_KEY: "test-service",
    } },
    console: { error() {} },
    async fetch(input, options = {}) {
      const url = new URL(input);
      const headers = new Headers(options.headers);
      calls.push({ url, method: options.method || "GET", headers, body: options.body });
      if (url.pathname === "/auth/v1/user") {
        const role = headers.get("Authorization")?.replace("Bearer ", "");
        return role === "expired" ? Response.json({}, { status: 401 }) : Response.json({ id: role });
      }
      if (url.pathname === "/rest/v1/profiles") {
        return Response.json([{ id: "profile-1", role: url.searchParams.get("auth_user_id").slice(3) }]);
      }
      if (url.pathname === "/rest/v1/buyers") return Response.json([]);
      assert.equal(url.pathname, "/rest/v1/vendors");
      if (options.method === "POST") {
        assert.equal(headers.get("Authorization"), "Bearer test-service");
        if (failInsert) return Response.json({ message: "Database unavailable" }, { status: 400 });
        const body = JSON.parse(options.body);
        const rows = (Array.isArray(body) ? body : [body]).map((record) => ({
          id: `10000000-0000-4000-8000-${String(vendors.length + 1).padStart(12, "0")}`,
          profile_id: null,
          ...record,
        }));
        vendors.push(...rows);
        return headers.get("Prefer") === "return=minimal" ? new Response(null, { status: 201 }) : Response.json(rows, { status: 201 });
      }
      let rows = vendors.filter((row) => [...url.searchParams].every(([key, value]) =>
        !value.startsWith("eq.") || String(row[key]) === value.slice(3),
      ));
      const offset = Number(url.searchParams.get("offset") || 0);
      const limit = Number(url.searchParams.get("limit") || 1000);
      rows = rows.slice(offset, offset + limit);
      return Response.json(rows);
    },
  });
  function load(file) {
    const path = resolve(root, file);
    if (cache.has(path)) return cache.get(path).exports;
    const loadedModule = { exports: {} };
    cache.set(path, loadedModule);
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const localRequire = (name) => {
      if (name === "server-only") return {};
      if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
      if (name.startsWith(".")) return load(`${resolve(dirname(path), name)}.ts`);
      return require(name);
    };
    vm.runInContext(`(function(require, module, exports) {${code}\n})`, context, { filename: path })(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return { load, vendors, calls, failNextInsert() { failInsert = true; } };
}

function request(body, role = "ADMIN") {
  return new Request("https://app.test/api/admin/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${role}` } : {}) },
    body: JSON.stringify(body),
  });
}

test("manual fields and the Excel template produce identical normalized listings", () => {
  const { load } = fixture();
  const lib = load("lib/vendorImport.ts");
  const fromSheet = lib.parseVendorSheet([lib.TEMPLATE_COLUMNS, lib.TEMPLATE_EXAMPLE_ROW]);
  assert.equal(fromSheet.ok, true);
  assert.deepEqual(plain(fromSheet.rowErrors), []);
  const input = Object.fromEntries([
    ...lib.VENDOR_REQUIRED_FIELDS.map((field, index) => [field.key, lib.TEMPLATE_EXAMPLE_ROW[index]]),
    ...lib.OPTIONAL_COLUMNS.map((field, index) => [field.key, lib.TEMPLATE_EXAMPLE_ROW[index + 8]]),
  ]);
  const manual = lib.validateVendorFields(input);
  assert.deepEqual(plain(manual.fieldErrors), {});
  assert.deepEqual(plain(lib.vendorListingRecord(manual.vendor)), plain(lib.vendorListingRecord(fromSheet.rows[0])));
});

test("each required field rejects blank values while logo and extra details are optional", () => {
  const lib = fixture().load("lib/vendorImport.ts");
  assert.deepEqual(plain(lib.validateVendorFields(fields).fieldErrors), {});
  for (const key of Object.keys(fields)) {
    assert(lib.validateVendorFields({ ...fields, [key]: " \t " }).fieldErrors[key], key);
  }
  for (const key of ["categories", "products"]) {
    assert(lib.validateVendorFields({ ...fields, [key]: ",;" }).fieldErrors[key]);
  }
  assert(lib.validateVendorFields({ ...fields, companyName: {} }).fieldErrors.companyName);
  assert(lib.validateVendorFields({ ...fields, website: [] }).fieldErrors.website);
});

test("links normalize bare domains and reject invalid or unsupported URLs", () => {
  const { validateVendorFields } = fixture().load("lib/vendorImport.ts");
  const valid = validateVendorFields({ ...fields, website: "example.com", linkedin: "www.linkedin.com/company/example", mapLink: "https://maps.google.com/?q=Example" });
  assert.deepEqual(plain(valid.fieldErrors), {});
  assert.equal(valid.vendor.extra.website, "https://example.com/");
  assert.equal(valid.vendor.extra.linkedin, "https://www.linkedin.com/company/example");
  assert.equal(validateVendorFields({ ...fields, website: "example.com:8080", mapLink: "https://maps.google.com/?q=Example Company" }).vendor.extra.mapLink, "https://maps.google.com/?q=Example%20Company");
  for (const key of ["logo", "website", "linkedin", "mapLink"]) {
    for (const value of ["not a URL", "javascript:alert(1)", "ftp://example.com/a", "https://"]) {
      assert(validateVendorFields({ ...fields, [key]: value }).fieldErrors[key], `${key}: ${value}`);
    }
  }
  assert(validateVendorFields({ ...fields, logo: "example.com/logo.png" }).fieldErrors.logo);
});

test("ratings accept template formats, zero and blank but reject negative or out of range values", () => {
  const { validateVendorFields } = fixture().load("lib/vendorImport.ts");
  for (const [input, expected] of [["4.5", 4.5], ["4.5/5", 4.5], ["4,5 stars", 4.5], [0, 0], [5, 5], ["", null]]) {
    const result = validateVendorFields({ ...fields, rating: input });
    assert.deepEqual(plain(result.fieldErrors), {});
    assert.equal(result.vendor.extra.rating, expected);
  }
  for (const rating of ["-1", "-0.5", "6", "not rated"]) {
    assert(validateVendorFields({ ...fields, rating }).fieldErrors.rating);
  }
});

test("legacy eight-column imports and reordered headers remain supported", () => {
  const lib = fixture().load("lib/vendorImport.ts");
  const legacy = lib.parseVendorSheet([lib.REQUIRED_COLUMNS, lib.TEMPLATE_EXAMPLE_ROW.slice(0, 8)]);
  assert.equal(legacy.ok, true);
  assert.deepEqual(plain(legacy.rowErrors), []);
  const reordered = lib.parseVendorSheet([[...lib.TEMPLATE_COLUMNS].reverse(), [...lib.TEMPLATE_EXAMPLE_ROW].reverse()]);
  assert.equal(reordered.ok, true);
  assert.deepEqual(plain(reordered.rowErrors), []);
  assert.equal(reordered.rows[0].companyName, fields.companyName);
  const duplicate = lib.parseVendorSheet([lib.REQUIRED_COLUMNS, lib.TEMPLATE_EXAMPLE_ROW, lib.TEMPLATE_EXAMPLE_ROW]);
  assert(duplicate.rowErrors.some((error) => error.message === "Duplicate of row 2."));
});

test("API rejects missing, expired, buyer and vendor sessions before creating a listing", async () => {
  for (const [role, status] of [[null, 401], ["expired", 401], ["BUYER", 403], ["VENDOR", 403]]) {
    const f = fixture();
    const route = f.load("app/api/admin/vendors/route.ts");
    assert.equal((await route.POST(request(fields, role))).status, status);
    assert.equal(f.vendors.length, 0);
    assert(!f.calls.some((call) => call.method === "POST"));
  }
});

test("API returns field errors and rejects malformed JSON without inserting", async () => {
  const f = fixture();
  const route = f.load("app/api/admin/vendors/route.ts");
  for (const input of [null, [], "text", {}, { ...fields, rating: "9" }, { ...fields, website: "invalid" }]) {
    assert.equal((await route.POST(request(input))).status, 400);
  }
  const invalid = await route.POST(request({ ...fields, companyName: " " }));
  assert((await invalid.json()).error.details.fieldErrors.companyName);
  assert.equal((await route.POST(new Request("https://app.test", { method: "POST", headers: { Authorization: "Bearer ADMIN" }, body: "{" }))).status, 400);
  assert.equal(f.vendors.length, 0);
  assert(!f.calls.some((call) => call.url.searchParams.get("select") === "company_name,registered_address,state"));
});

test("created vendor is approved, unclaimed and readable through the public listing API", async () => {
  const f = fixture();
  const route = f.load("app/api/admin/vendors/route.ts");
  const response = await route.POST(request({ ...fields, website: "example.com", rating: "0", profileId: "injected", listingVerified: true, source: "SELF_ONBOARDED" }));
  assert.equal(response.status, 201);
  const id = (await response.json()).vendor.id;
  const row = f.vendors[0];
  assert.equal(row.id, id);
  assert.equal(row.source, "ADMIN_CREATED");
  assert.equal(row.profile_id, null);
  assert.equal(row.approved, true);
  assert.equal(row.status, "approved");
  assert.equal(row.claim_status, "UNCLAIMED");
  assert.equal(row.listing_verified, false);
  assert.equal(row.country, "India");
  assert.deepEqual(row.sub_categories, ["Solar"]);
  assert.deepEqual(row.key_products, ["Solar panels", "Installation"]);
  assert.equal(row.public_contact.operatingHours, fields.operatingHours);
  assert.equal(row.public_contact.rating, 0);
  assert.equal(row.public_contact.sustainlyBadgeType, undefined);

  const publicApi = f.load("lib/supabasePublic.ts");
  const listed = await publicApi.fetchApprovedVendors();
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, id);
  assert.equal(listed[0].companyName, fields.companyName);
  assert.equal(listed[0].description, fields.description);
  assert.equal(listed[0].category, "Renewable Energy");
  assert.equal(listed[0].isUnclaimed, true);
  assert.equal(listed[0].publicContact.website, "https://example.com/");
  assert.equal((await publicApi.fetchApprovedVendorById(id)).id, id);
});

test("duplicate key ignores case and whitespace and permits different locations", async () => {
  const f = fixture();
  const route = f.load("app/api/admin/vendors/route.ts");
  assert.equal((await route.POST(request(fields))).status, 201);
  const duplicate = await route.POST(request({ ...fields, companyName: "  EXAMPLE  GREEN COMPANY ", address: " 12  EXAMPLE ROAD ", state: "karnataka" }));
  assert.equal(duplicate.status, 409);
  assert.match((await duplicate.json()).error.message, /already exists/);
  assert.equal(f.vendors.length, 1);
  assert.equal((await route.POST(request({ ...fields, state: "Kerala" }))).status, 201);
  assert.equal(f.vendors.length, 2);
});

test("database failures return a recoverable error", async () => {
  const f = fixture();
  const route = f.load("app/api/admin/vendors/route.ts");
  f.failNextInsert();
  const response = await route.POST(request(fields));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error.message, /try again/);
  assert.equal(f.vendors.length, 0);
});

test("Excel import creates equivalent records and skips existing manual listings", async () => {
  const f = fixture();
  const lib = f.load("lib/vendorImport.ts");
  const route = f.load("app/api/admin/vendors/route.ts");
  assert.equal((await route.POST(request(fields))).status, 201);
  const XLSX = require("xlsx");
  const workbook = XLSX.utils.book_new();
  const other = [...lib.TEMPLATE_EXAMPLE_ROW];
  other[1] = "Another Green Company";
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([lib.TEMPLATE_COLUMNS, lib.TEMPLATE_EXAMPLE_ROW, other]), "Vendors");
  const file = new File([XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })], "vendors.xlsx");
  const form = new FormData();
  form.append("file", file);
  const response = await f.load("app/api/admin/vendors/import/route.ts").POST(new Request("https://app.test", {
    method: "POST", headers: { Authorization: "Bearer ADMIN" }, body: form,
  }));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.inserted, 1);
  assert.equal(payload.skippedDuplicates, 1);
  assert.equal(f.vendors.length, 2);
  assert.equal(f.vendors[1].source, "CLIENT_IMPORT");
  assert.equal(f.vendors[1].public_contact.website, "https://example.com/");
  assert.equal(f.vendors[1].public_contact.rating, 4.5);
  assert.equal(f.vendors[1].claim_status, "UNCLAIMED");
  assert.match(f.vendors[1].import_batch_id, /^admin_excel_/);
  assert.deepEqual(f.vendors[1].raw_firebase, { importFile: "vendors.xlsx", sheetName: "Vendors", rowNumber: 3 });
});

function importRequest(rows, role = "ADMIN") {
  const XLSX = require("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Vendors");
  return fileImportRequest(new File([XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })], "vendors.xlsx"), role);
}

function fileImportRequest(file, role = "ADMIN") {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("https://app.test/api/admin/vendors/import", {
    method: "POST", headers: role ? { Authorization: `Bearer ${role}` } : {}, body: form,
  });
}

test("vendor list and Excel import enforce admin access", async () => {
  for (const [role, status] of [[null, 401], ["expired", 401], ["BUYER", 403], ["VENDOR", 403]]) {
    const f = fixture();
    const headers = role ? { Authorization: `Bearer ${role}` } : {};
    assert.equal((await f.load("app/api/admin/vendors/route.ts").GET(new Request("https://app.test/api/admin/vendors", { headers }))).status, status);
    assert.equal((await f.load("app/api/admin/vendors/import/route.ts").POST(fileImportRequest(null, role))).status, status);
    assert.equal(f.vendors.length, 0);
  }
});

test("Excel import rejects missing, empty, oversized and invalid workbook files", async () => {
  const f = fixture();
  const route = f.load("app/api/admin/vendors/import/route.ts");
  for (const [file, status] of [
    [null, 400],
    [new File(["text"], "vendors.csv"), 415],
    [new File([], "vendors.xlsx"), 413],
    [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "vendors.xlsx"), 413],
    [new File(["not a workbook"], "vendors.xlsx"), 400],
    [new File([new Uint8Array([0x50, 0x4b, 0, 0])], "vendors.xlsx"), 400],
  ]) {
    assert.equal((await route.POST(fileImportRequest(file))).status, status, file?.name || "missing file");
  }
  assert.equal(f.vendors.length, 0);
});

test("Excel import rejects missing/unknown columns and header-only worksheets", async () => {
  const f = fixture();
  const lib = f.load("lib/vendorImport.ts");
  const route = f.load("app/api/admin/vendors/import/route.ts");
  for (const rows of [
    [lib.REQUIRED_COLUMNS.slice(1), lib.TEMPLATE_EXAMPLE_ROW.slice(1, 8)],
    [[...lib.REQUIRED_COLUMNS, "Unexpected column"], lib.TEMPLATE_EXAMPLE_ROW.slice(0, 8)],
    [lib.TEMPLATE_COLUMNS],
  ]) {
    assert.equal((await route.POST(importRequest(rows))).status, 400);
  }
  assert.equal(f.vendors.length, 0);
});

test("Excel row errors retain actual spreadsheet row numbers after blank rows", async () => {
  const f = fixture();
  const lib = f.load("lib/vendorImport.ts");
  const invalid = [...lib.TEMPLATE_EXAMPLE_ROW];
  invalid[1] = "";
  const response = await f.load("app/api/admin/vendors/import/route.ts").POST(importRequest([lib.TEMPLATE_COLUMNS, [], [], invalid]));
  assert.equal(response.status, 400);
  const errors = (await response.json()).error.details.rowErrors;
  assert(errors.some(error => error.row === 4 && /Company Name/.test(error.message)));
  assert.equal(f.vendors.length, 0);
  const valid = await f.load("app/api/admin/vendors/import/route.ts").POST(importRequest([lib.TEMPLATE_COLUMNS, [], [], lib.TEMPLATE_EXAMPLE_ROW]));
  assert.equal(valid.status, 200);
  assert.equal(f.vendors[0].raw_firebase.rowNumber, 4);
});

test("Excel rejects duplicate rows and over-limit imports without partial inserts", async () => {
  const f = fixture();
  const lib = f.load("lib/vendorImport.ts");
  const route = f.load("app/api/admin/vendors/import/route.ts");
  const duplicate = await route.POST(importRequest([lib.TEMPLATE_COLUMNS, lib.TEMPLATE_EXAMPLE_ROW, lib.TEMPLATE_EXAMPLE_ROW]));
  assert.equal(duplicate.status, 400);
  assert((await duplicate.json()).error.details.rowErrors.some(error => /Duplicate/.test(error.message)));
  const rows = Array.from({ length: lib.MAX_IMPORT_ROWS + 1 }, (_, index) => {
    const row = [...lib.TEMPLATE_EXAMPLE_ROW];
    row[1] = `Example Company ${index}`;
    return row;
  });
  const excessive = await route.POST(importRequest([lib.TEMPLATE_COLUMNS, ...rows]));
  assert.equal(excessive.status, 400);
  assert.match((await excessive.json()).error.message, /1000/);
  assert.equal(f.vendors.length, 0);
});
