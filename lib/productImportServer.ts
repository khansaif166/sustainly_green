import "server-only";
import { apiError, apiOk } from "./apiResponse";
import { IMPORT_COLUMNS, MAX_IMPORT_ROWS, UUID_PATTERN, validateImportFields, type ImportCatalog, type ImportFields, type ImportImageManifest } from "./productImport";
import { MAX_IMAGE_BYTES } from "./productImages";
import { requireRole, supabaseServiceFetch, supabaseServiceFetchAll, SupabaseHttpError, toAuthError, toConfigError, type CurrentActor } from "./supabaseServer";

type Mode = "admin" | "vendor";
type RpcReceipt = { state: string; attemptId?: string; productId?: string | null; paths?: string[] };

async function importActor(request: Request, mode: Mode) {
  return requireRole(request, [mode === "admin" ? "ADMIN" : "VENDOR"]);
}

async function catalog(): Promise<ImportCatalog> {
  const [categories, subcategories, tags] = await Promise.all([
    supabaseServiceFetchAll<ImportCatalog["categories"][number]>("/rest/v1/categories?select=id,name,slug&active=eq.true&order=name.asc,id.asc"),
    supabaseServiceFetchAll<{ id: string; name: string; category_id: string }>("/rest/v1/subcategories?select=id,name,category_id&active=eq.true&order=name.asc,id.asc"),
    supabaseServiceFetchAll<ImportCatalog["tags"][number]>("/rest/v1/sustainability_tags?select=id,name&active=eq.true&order=name.asc,id.asc"),
  ]);
  return { categories, subcategories: subcategories.map(row => ({ id: row.id, name: row.name, categoryId: row.category_id })), tags };
}

function importError(error: unknown) {
  const known = toAuthError(error) ?? toConfigError(error);
  if (known) return apiError(known.message, known.status);
  if (error instanceof SupabaseHttpError) {
    if (error.code === "PGRST202" || error.code === "42P01" || error.code === "42883") return apiError("Bulk upload setup is missing. Apply the product spreadsheet import migration before importing.", 503);
    if (["23505", "22023", "42501"].includes(error.code ?? "")) return apiError(error.message, error.code === "23505" ? 409 : error.code === "42501" ? 403 : 400);
  }
  // Do not expose backend responses, credentials or complete product rows.
  console.error("PRODUCT_IMPORT_ERROR", error instanceof SupabaseHttpError ? error.code : error instanceof Error ? error.name : "unknown");
  return apiError("Unable to complete this import step. Keep this page open and retry the row to check its saved status.", 503);
}

export async function getProductImport(request: Request, mode: Mode) {
  try {
    const actor = await importActor(request, mode);
    if (mode === "vendor" && !actor.vendorId) return apiError("Complete vendor onboarding before importing products.", 403);
    const [masters, vendors] = await Promise.all([
      catalog(), mode === "admin" ? supabaseServiceFetchAll<{ id: string; company_name: string }>("/rest/v1/vendors?select=id,company_name&order=company_name.asc,id.asc") : Promise.resolve([]),
    ]);
    return apiOk({ catalog: masters, vendorId: actor.vendorId, vendors: vendors.map(row => ({ id: row.id, name: row.company_name })) });
  } catch (error) { return importError(error); }
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

async function rpc(name: string, body: Record<string, unknown>) {
  // Retry is controlled by the receipt-aware browser workflow, not generic
  // network retries of mutations. Each RPC is one database transaction.
  return supabaseServiceFetch<RpcReceipt>(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(body) }, false);
}

function responseReceipt(receipt: RpcReceipt) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return { ...receipt, paths: undefined, images: (receipt.paths ?? []).map(path => ({ path, url: `${base}/storage/v1/object/public/marketplace/${path}` })) };
}

async function abort(actor: CurrentActor, batchId: string, rowId: string, attemptId: string) {
  const receipt = await rpc("abort_product_import_row", { p_batch_id: batchId, p_row_id: rowId, p_attempt_id: attemptId, p_actor_profile_id: actor.profile.id });
  let cleanupWarning: string | undefined;
  if (receipt.state === "aborted" && receipt.paths?.length) {
    try {
      // SQL has marked this attempt aborted and selected only owned,
      // unreferenced objects. Old cleanup cannot affect a replacement attempt.
      await supabaseServiceFetch("/storage/v1/object/marketplace", { method: "DELETE", body: JSON.stringify({ prefixes: receipt.paths }) }, false);
    } catch { cleanupWarning = "Some unused photos could not be removed. Retrying this row is safe."; }
  }
  return apiOk({ ...responseReceipt(receipt), cleanupWarning });
}

export async function postProductImport(request: Request, mode: Mode) {
  try {
    const actor = await importActor(request, mode);
    const text = await request.text();
    if (text.length > 50000) return apiError("Import one product row at a time.", 413);
    let body: Record<string, unknown>;
    try { body = JSON.parse(text); } catch { return apiError("Invalid JSON body.", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return apiError("Invalid import request.", 400);
    if (!uuid(body.batchId) || !uuid(body.rowId)) return apiError("Invalid batch or row identity.", 400);
    if (body.action === "status") {
      return apiOk(await rpc("get_product_import_row", { p_batch_id: body.batchId, p_row_id: body.rowId, p_actor_profile_id: actor.profile.id }));
    }
    if (body.action === "commit" || body.action === "abort") {
      if (!uuid(body.attemptId)) return apiError("Invalid upload attempt.", 400);
      if (body.action === "abort") return await abort(actor, body.batchId, body.rowId, body.attemptId);
      const receipt = await rpc("commit_product_import_row", {
        p_batch_id: body.batchId, p_row_id: body.rowId, p_attempt_id: body.attemptId,
        p_actor_profile_id: actor.profile.id, p_storage_base_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      });
      return apiOk(responseReceipt(receipt));
    }
    if (body.action !== "prepare") return apiError("Invalid import action.", 400);
    if (!Number.isInteger(body.rowNumber) || Number(body.rowNumber) < 1 || Number(body.rowNumber) > MAX_IMPORT_ROWS) return apiError("A batch can contain at most 100 rows.", 400);
    const vendorId = mode === "vendor" ? actor.vendorId : body.vendorId;
    if (!uuid(vendorId)) return apiError(mode === "admin" ? "Select a vendor for this batch." : "Complete vendor onboarding before importing products.", 400);
    const fields = body.fields;
    if (!fields || typeof fields !== "object" || Array.isArray(fields) || Object.entries(fields).some(([name, value]) => !IMPORT_COLUMNS.includes(name as typeof IMPORT_COLUMNS[number]) || typeof value !== "string")) return apiError("Use only the supported spreadsheet columns with plain values.", 400);
    const validated = validateImportFields(fields as ImportFields, await catalog());
    if (validated.issues.length) return apiError("Correct this row before importing.", 400, { issues: validated.issues });
    if (!Array.isArray(body.images) || body.images.length !== validated.imageNames.length) return apiError("The photos do not match this spreadsheet row.", 400);
    const images: ImportImageManifest[] = [];
    for (const candidate of body.images) {
      if (!candidate || typeof candidate !== "object" || typeof candidate.name !== "string" ||
        !validated.imageNames.includes(candidate.name) || images.some(image => image.name === candidate.name) ||
        !["image/webp", "image/png"].includes(candidate.type) || !Number.isInteger(candidate.size) || candidate.size < 1 || candidate.size > MAX_IMAGE_BYTES ||
        typeof candidate.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(candidate.sha256)) return apiError("Invalid prepared photo. Re-select the source image and try again.", 400);
      images.push({ name: candidate.name, type: candidate.type, size: candidate.size, sha256: candidate.sha256 });
    }
    const receipt = await rpc("prepare_product_import_row", {
      p_batch_id: body.batchId, p_row_id: body.rowId, p_row_number: body.rowNumber,
      p_actor_profile_id: actor.profile.id, p_vendor_id: vendorId, p_payload: validated.product, p_images: images,
    });
    return apiOk(responseReceipt(receipt));
  } catch (error) { return importError(error); }
}
