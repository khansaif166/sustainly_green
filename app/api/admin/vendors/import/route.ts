import { randomUUID } from "node:crypto";

import { apiError, apiOk } from "@/lib/apiResponse";
import {
  requireRole,
  supabaseServiceFetch,
  toAuthError,
  toConfigError,
} from "@/lib/supabaseServer";
import { MAX_IMPORT_ROWS, parseVendorSheet, vendorKey } from "@/lib/vendorImport";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ExistingVendor = {
  company_name: string;
  registered_address: string | null;
  state: string | null;
};

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

    let XLSX: typeof import("xlsx");
    let workbook: import("xlsx").WorkBook;
    try {
      XLSX = await import("xlsx");
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
    const result = parseVendorSheet(rows);
    if (!result.ok) {
      return apiError(result.columnError, 400);
    }
    if (!result.rows.length) return apiError("The worksheet has no vendor rows.", 400);
    if (result.rows.length > MAX_IMPORT_ROWS) {
      return apiError(`A maximum of ${MAX_IMPORT_ROWS} vendor rows can be imported at once.`, 400);
    }
    if (result.rowErrors.length) {
      return apiError("Fix the highlighted Excel rows and upload the file again.", 400, {
        rowErrors: result.rowErrors,
      });
    }

    const importBatchId = `admin_excel_${randomUUID()}`;
    const parsed = result.rows.map((row) => ({
      key: row.key,
      excelRow: row.excelRow,
      record: {
        company_name: row.companyName,
        logo_url: row.logo || null,
        primary_category: row.categories[0] || null,
        sub_categories: row.categories.slice(1),
        key_products: row.products,
        registered_address: row.address || null,
        state: row.state || null,
        country: "India",
        short_description: row.description || null,
        // Public listing details that have no dedicated column live here,
        // alongside operatingHours (admin badge edits merge, not replace).
        public_contact: Object.fromEntries(
          Object.entries({ operatingHours: row.operatingHours || null, ...row.extra })
            .filter(([, value]) => value !== null && value !== ""),
        ),
        claim_status: "UNCLAIMED",
        source: "CLIENT_IMPORT",
        import_batch_id: importBatchId,
        approved: true,
        status: "approved",
        listing_verified: false,
        raw_firebase: { importFile: file.name, sheetName: workbook.SheetNames[0], rowNumber: row.excelRow },
      },
    }));

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
