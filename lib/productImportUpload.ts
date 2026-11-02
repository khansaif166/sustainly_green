import { UUID_PATTERN } from "./productImport";

export async function uploadImportPhoto(file: File, path: string, accessToken: string) {
  const parts = path.split("/");
  if (parts.length !== 7 || parts[0] !== "products" || parts[1] !== "imports" ||
    parts.slice(2, 6).some(part => !UUID_PATTERN.test(part)) || !/^[1-5]-[a-f0-9]{64}\.(webp|png)$/.test(parts[6])) throw new Error("Invalid photo upload target.");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("Missing public Supabase configuration.");
  const response = await fetch(`${base}/storage/v1/object/marketplace/${path}`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": file.type, "x-upsert": "false" },
    body: file, signal: AbortSignal.timeout(20000),
  });
  if (response.ok || response.status === 409) return;
  let payload: { statusCode?: string | number; message?: string } = {};
  try { payload = await response.json(); } catch { /* Cloudflare may return HTML. */ }
  // The target contains the prepared file hash and attempt UUID. A previous
  // interrupted upload may already exist; commit checks owner, MIME and size.
  if (String(payload.statusCode) === "409") return;
  throw new Error(response.status === 401 ? "Your session expired. Sign in again and retry this row." : "Photo upload failed. Retry this row; successfully created products will not be duplicated.");
}
