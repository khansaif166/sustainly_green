import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";

const inputPaths = process.argv.slice(2);
const defaultInputPaths = [
  "/Users/saifalikhan/Desktop/sustainly-green/Untitled spreadsheet (1).xlsx",
  "/Users/saifalikhan/Desktop/sustainly-green/Untitled spreadsheet (2).xlsx",
  "/Users/saifalikhan/Desktop/sustainly-green/Untitled spreadsheet (3).xlsx",
];
const files = inputPaths.length ? inputPaths : defaultInputPaths;
const importBatchId = "ecoideaz_alternative_energy_2026_07_08";

function loadEnv() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function clean(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized.length ? normalized : null;
}

function normalize(value) {
  return clean(value)?.toLowerCase() || "";
}

function vendorKey(vendor) {
  return [
    vendor.company_name,
    vendor.registered_address,
    vendor.city,
    vendor.state,
  ]
    .map(normalize)
    .join("|");
}

function parseRows() {
  const byKey = new Map();
  const parsedRows = [];

  for (const file of files) {
    const workbook = xlsx.readFile(file, { raw: false });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null,
      raw: false,
    });

    rows.forEach((row, index) => {
      const companyName = clean(row["Business Name"]);
      const address = clean(row.Address);
      const city = clean(row.City);
      const state = clean(row.State);
      const website = clean(row.Website);
      const primaryCategory = clean(row["Primary Category"]);
      const sourceUrl = clean(row["Source URL"]);

      if (!companyName || !address || !city || !state) return;

      const vendor = {
        company_name: companyName,
        registered_address: address,
        city,
        state,
        country: "India",
        primary_category: primaryCategory,
        public_contact: {
          website,
          source_url: sourceUrl,
        },
        claim_status: "UNCLAIMED",
        source: "CLIENT_IMPORT",
        import_batch_id: importBatchId,
        approved: true,
        status: "approved",
        listing_verified: false,
        raw_firebase: {
          import_file: path.basename(file),
          sheet_name: sheetName,
          row_number: index + 2,
          "Business Name": row["Business Name"],
          Address: row.Address,
          City: row.City,
          State: row.State,
          Website: row.Website,
          "Primary Category": row["Primary Category"],
          "Source URL": row["Source URL"],
        },
      };

      parsedRows.push(vendor);
      const key = vendorKey(vendor);
      if (!byKey.has(key)) byKey.set(key, vendor);
    });
  }

  return {
    parsedRows,
    uniqueRows: [...byKey.values()],
  };
}

async function supabaseFetch(pathname, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key.");
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function loadExistingVendorKeys() {
  const params = new URLSearchParams({
    select: "company_name,registered_address,city,state",
    limit: "20000",
  });
  const rows = await supabaseFetch(`/rest/v1/vendors?${params.toString()}`);
  return new Set(rows.map(vendorKey));
}

async function countBatch() {
  const params = new URLSearchParams({
    select: "id",
    import_batch_id: `eq.${importBatchId}`,
  });
  const rows = await supabaseFetch(`/rest/v1/vendors?${params.toString()}`, {
    headers: {
      Prefer: "count=exact",
    },
  });
  return rows.length;
}

async function main() {
  loadEnv();

  const { parsedRows, uniqueRows } = parseRows();
  const existingKeys = await loadExistingVendorKeys();
  const rowsToInsert = uniqueRows.filter((vendor) => !existingKeys.has(vendorKey(vendor)));
  const beforeBatchCount = await countBatch();

  if (rowsToInsert.length) {
    await supabaseFetch("/rest/v1/vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rowsToInsert),
    });
  }

  const afterBatchCount = await countBatch();

  console.log(
    JSON.stringify(
      {
        importBatchId,
        inputFiles: files.map((file) => path.basename(file)),
        parsedRows: parsedRows.length,
        uniqueRows: uniqueRows.length,
        skippedDuplicateSpreadsheetRows: parsedRows.length - uniqueRows.length,
        skippedExistingDbRows: uniqueRows.length - rowsToInsert.length,
        insertedRows: rowsToInsert.length,
        beforeBatchCount,
        afterBatchCount,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
