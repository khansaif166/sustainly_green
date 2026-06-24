import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";

const inputPath =
  process.argv[2] || "/Users/saifalikhan/Downloads/Businesses List.xlsx";
const outputPath =
  process.argv[3] ||
  "supabase/seeds/20260624_indiamart_01_unclaimed_vendors.sql";

const importBatchId = "indiamart_01_2026_06_24";
const sourceSheetName = "Sheet 1 - Indiamart 01";

function text(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function numericText(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  const normalized = text(value)?.replace(/\D+/g, "");
  return normalized?.length ? normalized : null;
}

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function formatPhone(areaCode, phone) {
  if (!areaCode || !phone) return null;
  return `0${areaCode}-${phone}`;
}

const workbook = xlsx.readFile(inputPath, { raw: true });
const sheetName = workbook.SheetNames.includes(sourceSheetName)
  ? sourceSheetName
  : workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: true });

const vendorRows = rows
  .map((row, index) => {
    const companyName = text(row.Company);
    const state = text(row.State);
    const city = text(row.City);
    const address = text(row.Address);
    const areaCode = numericText(row.phac);
    const phone = numericText(row.ph2);
    const pinCode = numericText(row.zp);

    if (!companyName || !state || !city || !address) return null;

    return {
      rowNumber: index + 3,
      companyName,
      state,
      city,
      address,
      areaCode,
      phone,
      pinCode,
      formattedPhone: formatPhone(areaCode, phone),
      raw: {
        import_file: path.basename(inputPath),
        sheet_name: sheetName,
        row_number: index + 3,
        Company: row.Company,
        State: row.State,
        City: row.City,
        Address: row.Address,
        ph2: row.ph2,
        phac: row.phac,
        zp: row.zp,
      },
    };
  })
  .filter(Boolean);

const values = vendorRows
  .map((vendor) => {
    const publicContact = {
      area_code: vendor.areaCode,
      phone: vendor.phone,
      formatted_phone: vendor.formattedPhone,
    };

    return `  (${[
      sqlString(vendor.companyName),
      sqlString(vendor.address),
      sqlString(vendor.city),
      sqlString(vendor.state),
      sqlString("India"),
      sqlString(vendor.pinCode),
      "null",
      sqlJson(publicContact),
      sqlString("UNCLAIMED"),
      sqlString("CLIENT_IMPORT"),
      sqlString(importBatchId),
      "true",
      sqlString("approved"),
      "false",
      sqlJson(vendor.raw),
    ].join(", ")})`;
  })
  .join(",\n");

const sql = `-- Seed unclaimed vendor listings from ${path.basename(inputPath)}
-- Source sheet: ${sheetName}
-- Rows prepared: ${vendorRows.length}
-- Run after:
--   1. 20260623055559_initial_sustainly_schema.sql
--   2. 20260623070000_vendor_claims.sql

begin;

with incoming (
  company_name,
  registered_address,
  city,
  state,
  country,
  pin_code,
  whatsapp,
  public_contact,
  claim_status,
  source,
  import_batch_id,
  approved,
  status,
  listing_verified,
  raw_firebase
) as (
values
${values}
)
insert into public.vendors (
  company_name,
  registered_address,
  city,
  state,
  country,
  pin_code,
  whatsapp,
  public_contact,
  claim_status,
  source,
  import_batch_id,
  approved,
  status,
  listing_verified,
  raw_firebase
)
select
  i.company_name,
  i.registered_address,
  i.city,
  i.state,
  i.country,
  i.pin_code,
  i.whatsapp,
  i.public_contact,
  i.claim_status::public.vendor_claim_status,
  i.source::public.vendor_source,
  i.import_batch_id,
  i.approved,
  i.status::public.review_status,
  i.listing_verified,
  i.raw_firebase
from incoming i
where not exists (
  select 1
  from public.vendors v
  where v.import_batch_id = i.import_batch_id
    and lower(v.company_name) = lower(i.company_name)
    and coalesce(v.registered_address, '') = coalesce(i.registered_address, '')
    and coalesce(v.city, '') = coalesce(i.city, '')
    and coalesce(v.state, '') = coalesce(i.state, '')
);

commit;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sql);

console.log(
  JSON.stringify(
    {
      inputPath,
      outputPath,
      sheetName,
      importBatchId,
      rowsPrepared: vendorRows.length,
    },
    null,
    2,
  ),
);
