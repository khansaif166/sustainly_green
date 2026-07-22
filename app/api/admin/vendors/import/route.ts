import { randomUUID } from "node:crypto";
import * as XLSX from "xlsx";

import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";

export const runtime = "nodejs";

const REQUIRED_HEADERS = [
  "Logo",
  "Company Name",
  "Categories",
  "Products/ Services",
  "Address",
  "State",
  "Operating Hours",
  "Business Description",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 1_000;

type ExistingVendor = {
  company_name: string;
  registered_address: string | null;
  state: string | null;
};

function clean(value: unknown) {
  return value == null ? "" : String(value).trim().replace(/\s+/g, " ");
}

function list(value: unknown) {
  return clean(value)
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function vendorKey(companyName: string, address: string, state: string) {
  return [companyName, address, state].map((value) => clean(value).toLocaleLowerCase()).join("|");
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return apiError("Choose an Excel file to import.", 400);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return apiError("Only .xlsx Excel files are accepted.", 415);
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return apiError("The Excel file must be between 1 byte and 5 MB.", 413);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      return apiError("The uploaded file is not a valid .xlsx workbook.", 400);
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(bytes, { type: "array", cellDates: false });
    } catch {
      return apiError("The Excel workbook could not be read.", 400);
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return apiError("The workbook does not contain a worksheet.", 400);
    const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });
    const headers = (rows[0] || []).map(clean);
    const headersAreExact =
      headers.length === REQUIRED_HEADERS.length &&
      REQUIRED_HEADERS.every((header) => headers.includes(header));
    if (!headersAreExact) {
      return apiError("The Excel columns do not match the required template.", 400, {
        requiredColumns: [...REQUIRED_HEADERS],
        receivedColumns: headers,
      });
    }

    const dataRows = rows.slice(1).filter((row) => row.some((value) => clean(value)));
    if (!dataRows.length) return apiError("The worksheet has no vendor rows.", 400);
    if (dataRows.length > MAX_ROWS) {
      return apiError(`A maximum of ${MAX_ROWS} vendor rows can be imported at once.`, 400);
    }

    const rowErrors: Array<{ row: number; message: string }> = [];
    const importBatchId = `admin_excel_${randomUUID()}`;
    const parsed = dataRows.map((row, index) => {
      const [logo, companyName, categoriesValue, productsValue, address, state, operatingHours, description] = REQUIRED_HEADERS.map(
        (header) => clean(row[headers.indexOf(header)]),
      );
      const excelRow = index + 2;
      const values = [logo, companyName, categoriesValue, productsValue, address, state, operatingHours, description];
      const missing = REQUIRED_HEADERS.filter((_, columnIndex) => !values[columnIndex]);
      if (missing.length) rowErrors.push({ row: excelRow, message: `Missing ${missing.join(", ")}.` });
      if (logo && !/^https?:\/\/\S+$/i.test(logo)) {
        rowErrors.push({ row: excelRow, message: "Logo must be a valid http(s) image URL." });
      }
      const categories = list(categoriesValue);
      return {
        key: vendorKey(companyName, address, state),
        excelRow,
        record: {
          company_name: companyName,
          logo_url: logo || null,
          primary_category: categories[0] || null,
          sub_categories: categories.slice(1),
          key_products: list(productsValue),
          registered_address: address || null,
          state: state || null,
          country: "India",
          short_description: description || null,
          public_contact: { operatingHours: operatingHours || null },
          claim_status: "UNCLAIMED",
          source: "CLIENT_IMPORT",
          import_batch_id: importBatchId,
          approved: true,
          status: "approved",
          listing_verified: false,
          raw_firebase: { importFile: file.name, sheetName: workbook.SheetNames[0], rowNumber: excelRow },
        },
      };
    });

    const seen = new Map<string, number>();
    for (const vendor of parsed) {
      const firstRow = seen.get(vendor.key);
      if (firstRow) {
        rowErrors.push({ row: vendor.excelRow, message: `Duplicate of row ${firstRow}.` });
      } else {
        seen.set(vendor.key, vendor.excelRow);
      }
    }
    if (rowErrors.length) {
      return apiError("Fix the highlighted Excel rows and upload the file again.", 400, { rowErrors });
    }

    const existing = await supabaseServiceFetch<ExistingVendor[]>(
      "/rest/v1/vendors?select=company_name,registered_address,state&limit=20000",
    );
    const existingKeys = new Set(existing.map((vendor) => vendorKey(
      vendor.company_name,
      vendor.registered_address || "",
      vendor.state || "",
    )));
    const duplicates = parsed.filter((vendor) => existingKeys.has(vendor.key));
    const toInsert = parsed.filter((vendor) => !existingKeys.has(vendor.key));

    if (toInsert.length) {
      await supabaseServiceFetch("/rest/v1/vendors", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(toInsert.map((vendor) => vendor.record)),
      });
    }

    return apiOk({
      ok: true,
      inserted: toInsert.length,
      skippedDuplicates: duplicates.length,
      totalRows: parsed.length,
      duplicateRows: duplicates.map((vendor) => vendor.excelRow),
    });
  } catch (error) {
    const authError = toAuthError(error);
    if (authError) return apiError(authError.message, authError.status);
    const configError = toConfigError(error);
    if (configError) return apiError(configError.message, configError.status);
    console.error("ADMIN_VENDOR_IMPORT_API_ERROR", error);
    return apiError("Unable to import vendors from Excel.", 503);
  }
}
