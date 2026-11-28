import "server-only";

import { z } from "zod";
import { apiError } from "@/lib/apiResponse";
import {
  ApiAuthError, fetchPrivateStorage, requireRole, SupabaseHttpError,
  supabaseServiceFetch, supabaseServiceFetchAll, toAuthError, toConfigError,
} from "@/lib/supabaseServer";
import {
  ASSET_LIMIT_MB, ASSET_MIME_TYPES, MEDIA, maskRegistration, phoneDial, PROFILE_ATTACHMENT_BATCH_LIMIT_MB, RICH_FIELDS,
  richContentSchema, safeWebUrl, videoSource,
  type AdKind, type AssetType, type CatalogOptions, type EditorData, type MediaPurpose,
  type RichContent, type RichFieldKey,
} from "@/lib/richVendorProfile";
import { vendorHref } from "@/lib/slug";
import { prefillRichContent, richPrefillColumns, type RichPrefillSource } from "@/lib/richVendorPrefill";
import type { PublicVendor } from "@/lib/supabasePublic";

const bucket = "vendor-rich";
const uuid = z.uuid();
const emptyContent = richContentSchema.parse({});

type VendorRow = {
  id: string; slug: string | null; approved: boolean;
  company_name: string; logo_url: string | null;
  registration_type: string | null; cin_registration: string | null; gst_number: string | null;
  year_of_incorporation: string | null; registered_address: string | null; pin_code: string | null;
  business_type: string | null; primary_contact_name: string | null; designation: string | null;
  business_email: string | null; whatsapp: string | null; alternate_phone: string | null;
  primary_sustainability_cert: string | null; issuing_body: string | null; certificate_file_url: string | null;
  additional_certs: unknown; sustainability_practice: string | null; recycled_content: string | null;
  carbon_footprint: string | null; social_compliance: string | null; net_zero_commitment: string | null;
  awards: string | null; awards_image_url: string | null; case_studies: string | null;
  export_capability: boolean; export_markets: string | null; key_products: string[] | null;
  payment_terms: string | null; language: string | null; supply_capacity: string | null; moq: string | null;
  target_industries: string | null; preferred_buyer_geography: string | null;
};
type ProfileRow = { active: boolean; content: unknown; revision: number };
type StoredAsset = { id: string; title: string; source_url: string | null; storage_path: string | null; mime_type: string | null };
type MediaRow = StoredAsset & {
  purpose: MediaPurpose;
  credential_record_only: boolean;
  news_record_only: boolean;
};
type AdRow = StoredAsset & {
  kind: AdKind; link_url: string | null; sort_order: number;
  vendor_enabled: boolean; admin_enabled: boolean; deleted_at: string | null;
};

const vendorColumns = [
  "id", "slug", "approved", "company_name", "logo_url", "registration_type", "cin_registration", "gst_number",
  "year_of_incorporation", "registered_address", "pin_code", "business_type", "primary_contact_name",
  "designation", "business_email", "whatsapp", "alternate_phone", "primary_sustainability_cert", "issuing_body",
  "certificate_file_url", "additional_certs", "sustainability_practice", "recycled_content", "carbon_footprint",
  "social_compliance", "net_zero_commitment", "awards", "awards_image_url", "case_studies", "export_capability",
  "export_markets", "key_products", "payment_terms", "language", "supply_capacity", "moq", "target_industries",
  "preferred_buyer_geography",
].join(",");
const assetColumns = "id,title,source_url,storage_path,mime_type";
const mediaColumns = `${assetColumns},purpose,credential_record_only,news_record_only`;
const adColumns = `${assetColumns},kind,link_url,sort_order,vendor_enabled,admin_enabled,deleted_at`;

function findRows<T>(table: string, params: Record<string, string>) {
  return supabaseServiceFetch<T[]>(`/rest/v1/${table}?${new URLSearchParams(params)}`, { cache: "no-store" });
}

export async function loadCatalogOptions(): Promise<CatalogOptions> {
  const [categories, subcategories, bodies] = await Promise.all([
    supabaseServiceFetchAll<CatalogOptions["categories"][number]>("/rest/v1/categories?select=id,name&active=eq.true&order=name.asc,id.asc"),
    supabaseServiceFetchAll<CatalogOptions["subcategories"][number]>("/rest/v1/subcategories?select=id,name,category_id&active=eq.true&order=name.asc,id.asc"),
    supabaseServiceFetchAll<CatalogOptions["bodies"][number]>("/rest/v1/certifying_bodies?select=id,name&status=eq.Active&order=name.asc,id.asc"),
  ]);
  return { categories, subcategories, bodies };
}

function loadProfile(id: string) {
  return findRows<ProfileRow>("vendor_rich_profiles", { vendor_id: `eq.${id}`, select: "active,content,revision", limit: "1" })
    .then(rows => rows[0]);
}

function loadMedia(id: string) {
  return findRows<MediaRow>("vendor_rich_media", {
    vendor_id: `eq.${id}`, select: mediaColumns, order: "sort_order.asc,created_at.asc,id.asc",
  });
}

function loadAds(id: string, options: { admin?: boolean; publicOnly?: boolean } = {}) {
  const params: Record<string, string> = {
    vendor_id: `eq.${id}`, select: adColumns, order: "sort_order.asc,created_at.asc,id.asc",
    ...(options.admin ? { or: "(deleted_at.is.null,admin_enabled.is.false)" } : { deleted_at: "is.null" }),
    ...(options.publicOnly ? { vendor_enabled: "eq.true", admin_enabled: "eq.true" } : {}),
  };
  if (options.admin) {
    return supabaseServiceFetchAll<AdRow>(`/rest/v1/vendor_rich_ads?${new URLSearchParams(params)}`);
  }
  return findRows<AdRow>("vendor_rich_ads", params);
}

function readContent(profile: ProfileRow | undefined) {
  return profile ? richContentSchema.parse(profile.content) : emptyContent;
}

function usesCredentialMedia(content: RichContent, id: string, purpose?: MediaPurpose) {
  if (purpose === "credential") return content.certificates.some(item => item.documentId === id);
  return purpose === "award" && content.awards.some(item => item.imageId === id);
}

export async function isRichVendorActive(id: string) {
  try {
    const rows = await findRows<{ active: boolean }>("vendor_rich_profiles", {
      vendor_id: `eq.${id}`, select: "active,vendors!inner(approved)", "vendors.approved": "eq.true",
      active: "eq.true", limit: "1",
    });
    return Boolean(rows[0]);
  } catch (error) {
    if (error instanceof SupabaseHttpError && ["PGRST205", "42P01"].includes(error.code || "")) return false;
    throw error;
  }
}

export async function getEditorActor(request: Request, requestedId?: string) {
  const actor = await requireRole(request, requestedId ? ["ADMIN"] : ["VENDOR"]);
  const vendorId = requestedId || actor.vendorId;
  if (!vendorId || !uuid.safeParse(vendorId).success) throw new ApiAuthError("Vendor not found.", 404);
  return { actor, vendorId };
}

type EditorActor = Awaited<ReturnType<typeof getEditorActor>>;

export async function loadRichEditor({ actor, vendorId }: EditorActor, catalog?: Promise<CatalogOptions>): Promise<EditorData> {
  const prefill = actor.role === "ADMIN" && catalog;
  const [[vendor], profile, media, ads] = await Promise.all([
    findRows<Pick<VendorRow, "id" | "slug" | "approved"> & RichPrefillSource>("vendors", {
      id: `eq.${vendorId}`, select: prefill ? `id,slug,approved,${richPrefillColumns}` : "id,slug,approved", limit: "1",
    }),
    loadProfile(vendorId), loadMedia(vendorId), loadAds(vendorId, { admin: actor.role === "ADMIN" }),
  ]);
  if (!vendor) throw new ApiAuthError("Vendor not found.", 404);
  const saved = readContent(profile);
  const content: RichContent = {
    ...saved,
    certificates: saved.certificates.map(item => item.documentId &&
      !media.some(asset => asset.id === item.documentId && asset.purpose === "credential") ? { ...item, documentId: "" } : item),
    awards: saved.awards.map(item => item.imageId &&
      !media.some(asset => asset.id === item.imageId && asset.purpose === "award") ? { ...item, imageId: "" } : item),
    news: saved.news.map(item => item.imageId && !media.some(asset => asset.id === item.imageId && asset.news_record_only)
      ? { ...item, imageId: "" } : item),
  };
  return {
    active: Boolean(profile?.active),
    approved: vendor.approved,
    editable: actor.role === "ADMIN" || Boolean(profile?.active && vendor.approved && actor.profile.vendor_approved),
    revision: profile?.revision ?? 0,
    content,
    draftContent: prefill ? prefillRichContent(content, vendor, await prefill) : undefined,
    href: vendorHref(vendor.id, vendor.slug),
    media: media.map(row => ({
      id: row.id, purpose: row.purpose, title: row.title, sourceUrl: row.source_url, mimeType: row.mime_type,
      fileVersion: row.storage_path?.split("/").at(-1) || null,
    })),
    ads: ads.map(row => ({
      id: row.id, kind: row.kind, title: row.title, sourceUrl: row.source_url, mimeType: row.mime_type,
      linkUrl: row.link_url, fileVersion: row.storage_path?.split("/").at(-1) || null,
      vendorEnabled: row.vendor_enabled, adminEnabled: row.admin_enabled,
      sortOrder: row.sort_order, deleted: Boolean(row.deleted_at),
    })),
  };
}

function storageObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function removeRichStorage(paths: string[]) {
  if (!paths.length) return;
  const response = await fetchPrivateStorage(`object/${bucket}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!response.ok) throw new Error(`Rich Profile storage cleanup failed (${response.status}).`);
}

export async function deleteRichVendorFiles(vendorId: string) {
  const [media, ads] = await Promise.all([
    supabaseServiceFetchAll<{ storage_path: string }>(`/rest/v1/vendor_rich_media?select=id,storage_path&vendor_id=eq.${vendorId}&storage_path=not.is.null&order=id.asc`),
    supabaseServiceFetchAll<{ storage_path: string }>(`/rest/v1/vendor_rich_ads?select=id,storage_path&vendor_id=eq.${vendorId}&storage_path=not.is.null&order=id.asc`),
  ]).catch(error => {
    if (error instanceof SupabaseHttpError && ["PGRST205", "42P01"].includes(error.code || "")) return [[], []];
    throw error;
  });
  await removeRichStorage([...new Set([...media, ...ads].map(row => row.storage_path))]);
}

export class RichInputError extends Error {}
class RichConflictError extends Error {}
class RichUploadError extends Error {}
class RichSaveUncertainError extends Error {}

async function assetDigest(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function uploadRichAsset(path: string, bytes: ArrayBuffer, mimeType: string, digest: string) {
  let timedOut = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    let retryable = true;
    try {
      const response = await fetchPrivateStorage(`object/${bucket}/${storageObjectPath(path)}`, {
        method: "POST", headers: { "Content-Type": mimeType, "x-upsert": "false" }, body: bytes,
        signal: AbortSignal.timeout(90_000),
      });
      if (response.ok) return;
      const failure = await response.json().catch(() => null) as { code?: string; error?: string; message?: string } | null;
      const duplicate = response.status === 400 && (failure?.code === "ResourceAlreadyExists" || failure?.code === "KeyAlreadyExists" ||
        /already exists|duplicate/i.test(`${failure?.error || ""} ${failure?.message || ""}`));
      retryable = duplicate || response.status === 409 || response.status === 429 || response.status >= 500;
      console.error("RICH_PROFILE_STORAGE_UPLOAD_FAILED", { status: response.status, attempt: attempt + 1 });
    } catch (error) {
      const name = error && typeof error === "object" && "name" in error ? error.name : "";
      timedOut = name === "TimeoutError" || name === "AbortError";
      console.error("RICH_PROFILE_STORAGE_UPLOAD_FAILED", error);
    }
    if (!retryable) throw new RichUploadError("File storage rejected the upload. Please try again or contact support.");

    // A lost upload response may still have stored the file. Verify the bytes
    // at this request's fresh UUID path before retrying without overwriting it.
    try {
      const stored = await fetchPrivateStorage(`object/authenticated/${bucket}/${storageObjectPath(path)}`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (stored.ok) {
        const uploaded = await stored.arrayBuffer();
        if (uploaded.byteLength === bytes.byteLength && await assetDigest(uploaded) === digest) return;
      }
    } catch { /* Leave possibly stored bytes intact when their state is unknown. */ }
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new RichUploadError(timedOut
    ? "The file upload timed out. Your selection is ready to retry."
    : "File storage could not be reached. Your selection is ready to retry.");
}

function hasFileSignature(mime: string, bytes: Uint8Array) {
  const ascii = (start: number, count: number) => String.fromCharCode(...bytes.subarray(start, start + count));
  switch (mime) {
    case "image/jpeg": return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    case "image/png": return bytes[0] === 137 && ascii(1, 3) === "PNG" && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    case "video/mp4": return ascii(4, 4) === "ftyp";
    case "video/webm": return bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163;
    default: return false;
  }
}

async function createSource(vendorId: string, type: AssetType, file: FormDataEntryValue | null, link: string) {
  if (file instanceof File && file.size) {
    if (link) throw new RichInputError("Choose a file or a video link.");
    const types: string[] = ASSET_MIME_TYPES[type];
    if (!types.includes(file.type) || file.size > ASSET_LIMIT_MB[type] * 1024 * 1024) {
      throw new RichInputError(`Choose an accepted file up to ${ASSET_LIMIT_MB[type]} MB.`);
    }
    const bytes = await file.arrayBuffer();
    if (!hasFileSignature(file.type, new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12)))) {
      throw new RichInputError("The file contents do not match its format.");
    }
    const digest = await assetDigest(bytes);
    const path = `${vendorId}/${crypto.randomUUID()}`;
    await uploadRichAsset(path, bytes, file.type, digest);
    return { storagePath: path, mimeType: file.type, sourceKey: `file:${digest}` };
  }
  if (link) {
    const video = type === "video" ? videoSource(link) : undefined;
    if (!video) throw new RichInputError("Enter a YouTube, Vimeo, or HTTPS MP4 or WebM link.");
    return { sourceUrl: video.url, sourceKey: video.key };
  }
}

const contentWrite = z.object({ action: z.literal("content"), revision: z.number().int().nonnegative(), content: richContentSchema });
const richAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate"), active: z.boolean() }),
  contentWrite,
  z.object({ action: z.literal("moderate"), id: uuid, enabled: z.boolean() }),
  z.object({ action: z.enum(["delete_ad", "delete_media"]), id: uuid }),
]);
const uploadBase = { title: z.string().trim().min(1).max(120), sourceUrl: z.string().trim().max(2048) };
const mediaInput = z.object({ ...uploadBase, purpose: z.enum(Object.keys(MEDIA) as [MediaPurpose, ...MediaPurpose[]]) });
const newsImageInput = z.object({ title: uploadBase.title });
const coverReplacementInput = z.object({ ...uploadBase, id: uuid });
const adInput = z.object({
  ...uploadBase, id: uuid.optional(), kind: z.enum(["banner", "video"]),
  enabled: z.boolean(), sortOrder: z.number().int().min(0).max(9999),
  linkUrl: z.string().trim().max(2048).transform((value, ctx) => {
    const url = safeWebUrl(value);
    if (value && !url) ctx.addIssue({ code: "custom", message: "Enter a valid destination URL." });
    return url;
  }),
});

async function validateContentReferences(vendorId: string, content: RichContent) {
  const [media, catalog] = await Promise.all([loadMedia(vendorId), loadCatalogOptions()]);
  if (content.categories.some(pair => !catalog.categories.some(category => category.id === pair.categoryId) ||
      (pair.subcategoryId && !catalog.subcategories.some(sub => sub.id === pair.subcategoryId && sub.category_id === pair.categoryId)))) {
    throw new RichInputError("Choose an active category and a matching subcategory.");
  }
  if (content.certificates.some(item => item.documentId &&
      !media.some(asset => asset.id === item.documentId && asset.purpose === "credential"))) {
    throw new RichInputError("A certification PDF was removed. Reload the editor before saving.");
  }
  const unavailableBodies = content.certificates.filter(item => item.bodyId && !catalog.bodies.some(body => body.id === item.bodyId));
  if (unavailableBodies.length) {
    const saved = readContent(await loadProfile(vendorId));
    if (unavailableBodies.some(item => !saved.certificates.some(record => record.bodyId === item.bodyId))) {
      throw new RichInputError("Choose an available certification body.");
    }
  }
  if (content.awards.some(item => item.imageId && !media.some(asset => asset.id === item.imageId && asset.purpose === "award"))) {
    throw new RichInputError("An award image is unavailable. Reload the editor before saving.");
  }
  if (content.news.some(item => item.imageId && !media.some(asset => asset.id === item.imageId && asset.news_record_only))) {
    throw new RichInputError("A news image is unavailable. Reload the editor before saving.");
  }
  return media;
}

async function saveContentAttachments(form: FormData, { actor, vendorId }: EditorActor, revision: number, certificatesOnly: boolean) {
  const payload = form.get("payload");
  if (typeof payload !== "string") throw new RichInputError("The profile details are missing.");
  const parsed = contentWrite.parse(JSON.parse(payload));
  if (parsed.revision !== revision) {
    throw new RichConflictError("This profile was updated in another session. Reload before saving.");
  }
  const selected = new Map<string, { file: File; index: number; purpose: "award" | "credential"; recordName: string }>();
  for (const [name, file] of form) {
    const [kind, position] = name.split(":");
    if (kind !== "certificate-pdf" && kind !== "award-image") continue;
    const index = Number(position);
    const isAward = kind === "award-image";
    const record = isAward ? parsed.content.awards[index] : parsed.content.certificates[index];
    if ((certificatesOnly && isAward) || name !== `${kind}:${index}` || !record || selected.has(name) || !(file instanceof File) || !file.size) {
      throw new RichInputError(isAward ? "Choose one image for an existing award record." : "Choose one PDF for an existing certificate record.");
    }
    if ("imageId" in record) record.imageId = "";
    else record.documentId = "";
    selected.set(name, { file, index, purpose: isAward ? "award" : "credential", recordName: record.name });
  }
  if (!selected.size) throw new RichInputError(certificatesOnly ? "Choose a certificate PDF." : "Choose a certificate PDF or award image.");
  const uploads = [...selected.values()];
  const selectedBytes = uploads.reduce((bytes, { file }) => bytes + file.size, 0);
  if (selectedBytes > PROFILE_ATTACHMENT_BATCH_LIMIT_MB * 1024 * 1024) {
    throw new RichInputError(`Upload up to ${PROFILE_ATTACHMENT_BATCH_LIMIT_MB} MB of ${certificatesOnly ? "certificate PDFs" : "award images and certificate PDFs"} per save.`);
  }
  const media = await validateContentReferences(vendorId, parsed.content);
  for (const purpose of ["credential", "award"] as const) {
    const pending = uploads.filter(item => item.purpose === purpose).length;
    if (pending && media.filter(item => item.purpose === purpose).length + pending > MEDIA[purpose].limit) {
      throw new RichInputError(`Remove unused files from the ${purpose === "credential" ? "Certifications" : "Awards"} tab or choose fewer files.`);
    }
  }

  const staged: { index: number; title: string; storagePath: string; mimeType: string; purpose: "award" | "credential" }[] = [];
  try {
    for (const { index, file, purpose, recordName } of uploads) {
      const source = await createSource(vendorId, MEDIA[purpose].type, file, "");
      if (!source?.storagePath || !source.mimeType) throw new RichInputError("Choose an attachment file.");
      const title = file.name.replace(/\.(pdf|jpe?g|png|webp)$/i, "").trim().slice(0, 120) || recordName.slice(0, 120);
      staged.push({ index, title, storagePath: source.storagePath, mimeType: source.mimeType, purpose });
    }
  } catch (error) {
    await removeRichStorage(staged.map(pdf => pdf.storagePath)).catch(console.error);
    throw error;
  }

  try {
    const rpc = certificatesOnly ? "save_rich_certificate_pdfs" : "save_rich_content_attachments";
    await supabaseServiceFetch(`/rest/v1/rpc/${rpc}`, {
      method: "POST",
      body: JSON.stringify({
        p_vendor_id: vendorId, p_actor_profile_id: actor.profile.id,
        p_data: { revision: parsed.revision, content: parsed.content },
        ...(certificatesOnly ? { p_pdfs: staged } : { p_attachments: staged }),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    }, false);
  } catch (error) {
    if (error instanceof SupabaseHttpError && (error.status < 500 || error.code === "40001")) {
      await removeRichStorage(staged.map(pdf => pdf.storagePath)).catch(console.error);
      throw error;
    }
    // The first uploaded path can only appear in the database if the whole save committed.
    const [saved] = await findRows<{ id: string }>("vendor_rich_media", {
      select: "id", vendor_id: `eq.${vendorId}`, storage_path: `eq.${staged[0].storagePath}`, limit: "1",
    }).catch(() => []);
    if (!saved) throw new RichSaveUncertainError("The save could not be confirmed. Reload the editor before retrying.");
  }
  return null;
}

export async function writeRichEditor(request: Request, editor: EditorActor) {
  const { actor, vendorId } = editor;
  let action: string;
  let data: Record<string, unknown>;
  let newPath: string | undefined;
  let replacedPath: string | null = null;
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("multipart/form-data")) {
    const [[vendor], profile] = await Promise.all([
      findRows<Pick<VendorRow, "approved">>("vendors", { select: "approved", id: `eq.${vendorId}`, limit: "1" }),
      loadProfile(vendorId),
    ]);
    if (!vendor) throw new ApiAuthError("Vendor not found.", 404);
    if (actor.role !== "ADMIN" && (!profile?.active || !vendor.approved || !actor.profile.vendor_approved)) {
      throw new ApiAuthError("Rich Profile is currently read-only.", 403);
    }
    const requestLimit = 26 * 1024 * 1024;
    if (!request.body || Number(request.headers.get("content-length")) > requestLimit) {
      throw new RichInputError("The upload exceeds 25 MB.");
    }
    let bytes = 0;
    const bounded = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        if (bytes > requestLimit) controller.error(new RichInputError("The upload exceeds 25 MB."));
        else controller.enqueue(chunk);
      },
    }));
    let form: FormData;
    try {
      form = await new Response(bounded, { headers: { "Content-Type": contentType } }).formData();
    } catch (error) {
      if (error instanceof RichInputError) throw error;
      throw new RichInputError("The upload could not be read. Choose the file again and retry.");
    }
    const input = Object.fromEntries(form);
    action = String(input.action ?? "");
    if (action === "save_certificate_pdfs" || action === "save_content_attachments") {
      return saveContentAttachments(form, editor, profile?.revision ?? 0, action === "save_certificate_pdfs");
    } else if (action === "add_news_image") {
      const { title } = newsImageInput.parse(input);
      const source = await createSource(vendorId, "image", form.get("file"), "");
      if (!source) throw new RichInputError("Choose an image for the news update.");
      newPath = source.storagePath;
      data = { title, ...source };
    } else if (action === "add_media") {
      const parsed = mediaInput.parse(input);
      const source = await createSource(vendorId, MEDIA[parsed.purpose].type, form.get("file"), parsed.sourceUrl);
      if (!source) throw new RichInputError("Choose a media file or video link.");
      newPath = source.storagePath;
      data = { ...parsed, sourceUrl: undefined, ...source };
    } else if (action === "replace_cover") {
      const parsed = coverReplacementInput.parse(input);
      const [existing] = await findRows<{ storage_path: string | null }>("vendor_rich_media", {
        select: "storage_path", vendor_id: `eq.${vendorId}`, id: `eq.${parsed.id}`, purpose: "eq.cover", limit: "1",
      });
      if (!existing) throw new ApiAuthError("Cover image was removed. Reload before replacing it.", 404);
      replacedPath = existing.storage_path;
      const source = await createSource(vendorId, "image", form.get("file"), parsed.sourceUrl);
      if (!source) throw new RichInputError("Choose a replacement cover image.");
      newPath = source.storagePath;
      data = { id: parsed.id, title: parsed.title, ...source };
    } else if (action === "save_ad") {
      const parsed = adInput.parse({
        ...input, id: input.id || undefined, enabled: input.enabled === "true", sortOrder: Number(input.sortOrder),
      });
      let kind = parsed.kind;
      if (parsed.id) {
        const [existing] = await findRows<{ kind: AdKind }>("vendor_rich_ads", {
          select: "kind", vendor_id: `eq.${vendorId}`, id: `eq.${parsed.id}`, deleted_at: "is.null", limit: "1",
        });
        if (!existing) throw new ApiAuthError("Ad not found.", 404);
        kind = existing.kind;
      }
      const source = await createSource(vendorId, kind === "banner" ? "image" : "video", form.get("file"), parsed.sourceUrl);
      newPath = source?.storagePath;
      data = { ...parsed, sourceUrl: undefined, ...source, kind };
    } else {
      throw new RichInputError("Unsupported upload action.");
    }
  } else {
    const { action: incomingAction, ...rest } = richAction.parse(await request.json());
    action = incomingAction;
    data = rest;
    if (action === "content") await validateContentReferences(vendorId, data.content as RichContent);
  }
  const newsImage = action === "add_news_image";
  const rpc = newsImage ? "add_vendor_rich_news_image" : "write_vendor_rich_profile";
  let result: { oldPath: string | null; id: string | null };
  try {
    result = await supabaseServiceFetch<{ oldPath: string | null; id: string | null }>(
      `/rest/v1/rpc/${rpc}`, {
        method: "POST",
        body: JSON.stringify({
          p_vendor_id: vendorId, p_actor_profile_id: actor.profile.id, p_data: data,
          ...(!newsImage && { p_action: action }),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
      false,
    );
  } catch (error) {
    // A transport error can arrive after a commit. Only remove the newly
    // uploaded object when PostgREST explicitly rejected the transaction.
    if (newPath && error instanceof SupabaseHttpError && error.status < 500) {
      await removeRichStorage([newPath]).catch(console.error);
      throw error;
    }
    if (!newPath) throw error;
    console.error("RICH_PROFILE_SAVE_RESPONSE_LOST", error);
    // Never retry a mutation blindly: the original transaction may have
    // committed before its response timed out. Its new UUID storage path is
    // an unambiguous receipt we can safely check with a read.
    const table = action === "save_ad" ? "vendor_rich_ads" : "vendor_rich_media";
    const [saved] = await findRows<{ id: string }>(table, {
      select: "id", vendor_id: `eq.${vendorId}`, storage_path: `eq.${newPath}`, limit: "1",
      ...(action === "save_ad" ? { deleted_at: "is.null" } : {}),
      ...(newsImage ? { news_record_only: "eq.true" } : {}),
    }).catch(() => []);
    if (!saved) throw new RichSaveUncertainError("The save could not be confirmed. Reload the editor before retrying.");
    result = { id: saved.id, oldPath: replacedPath };
  }
  if (result.oldPath && result.oldPath !== newPath) await removeRichStorage([result.oldPath]).catch(console.error);
  return result.id;
}

export function richApiError(error: unknown) {
  const auth = toAuthError(error);
  if (auth) return apiError(auth.message, auth.status);
  const config = toConfigError(error);
  if (config) return apiError(config.message, config.status);
  if (error instanceof RichUploadError || error instanceof RichSaveUncertainError) return apiError(error.message, 503);
  if (error instanceof RichConflictError) return apiError(error.message, 409);
  if (error instanceof RichInputError || error instanceof SyntaxError) return apiError(error.message, 400);
  if (error instanceof z.ZodError) return apiError(error.issues[0]?.message || "Invalid Rich Profile data.", 400);
  if (error instanceof SupabaseHttpError) {
    if (error.code === "42501") return apiError(error.message, 403);
    if (error.code === "P0002") return apiError(error.message, 404);
    if (["23514", "40001"].includes(error.code || "")) return apiError(error.message, 409);
    if (error.code === "23505") return apiError("This creative is already saved as an ad.", 409);
  }
  console.error("RICH_VENDOR_PROFILE_ERROR", error);
  return apiError("Rich Profile is temporarily unavailable.", 503);
}

export function mediaHref(id: string, type: "asset" | "ad") {
  return `/api/rich-vendor-media/${type}/${id}`;
}

export async function serveRichMedia(request: Request, type: string, id: string) {
  if (!uuid.safeParse(id).success || (type !== "asset" && type !== "ad")) return new Response(null, { status: 404 });
  const table = type === "asset" ? "vendor_rich_media" : "vendor_rich_ads";
  const [row] = await findRows<StoredAsset & Partial<MediaRow & AdRow> & { vendor_id: string }>(table, {
    id: `eq.${id}`,
    select: `vendor_id,${type === "asset" ? mediaColumns : `${assetColumns},vendor_enabled,admin_enabled,deleted_at`}`,
    limit: "1",
  });
  if (!row?.storage_path) return new Response(null, { status: 404 });
  if (request.headers.has("authorization")) {
    const actor = await requireRole(request, ["ADMIN", "VENDOR"]);
    if (actor.role !== "ADMIN" && actor.vendorId !== row.vendor_id) return new Response(null, { status: 404 });
    if (row.deleted_at) return new Response(null, { status: 404 });
  } else {
    if (type === "ad" && (row.deleted_at || !row.vendor_enabled || !row.admin_enabled)) return new Response(null, { status: 404 });
    if (!(await isRichVendorActive(row.vendor_id))) return new Response(null, { status: 404 });
    if (row.news_record_only) {
      const profile = await loadProfile(row.vendor_id);
      if (!profile?.active || !readContent(profile).news.some(item => item.published && item.imageId === id)) {
        return new Response(null, { status: 404 });
      }
    }
    if (row.credential_record_only) {
      const profile = await loadProfile(row.vendor_id);
      if (!profile?.active || !usesCredentialMedia(readContent(profile), id, row.purpose)) return new Response(null, { status: 404 });
    }
    if (row.purpose === "director" || row.purpose === "contact") {
      const profile = await loadProfile(row.vendor_id);
      const key = row.purpose === "director" ? "publishDirector" : "publishContact";
      if (!profile?.active || !readContent(profile).fields[key]) return new Response(null, { status: 404 });
    }
  }

  const range = request.headers.get("range");
  const upstream = await fetchPrivateStorage(`object/authenticated/${bucket}/${storageObjectPath(row.storage_path)}`, {
    headers: range ? { Range: range } : {},
    method: request.method === "HEAD" ? "HEAD" : "GET",
    signal: request.signal,
  });
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (upstream.ok || upstream.status === 416) {
    if (row.mime_type) headers.set("Content-Type", row.mime_type);
    for (const name of ["accept-ranges", "content-range", "content-length"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers });
  }
  return new Response(null, { status: upstream.status >= 500 ? 503 : 404, headers });
}

type PublicAsset = { id: string; title: string; url: string; embedded?: boolean; thumbnailUrl?: string };
export type PublicRichProfile = NonNullable<Awaited<ReturnType<typeof loadPublicRichProfile>>>;

function toPublicAsset(row: StoredAsset, type: "asset" | "ad"): PublicAsset | null {
  if (row.storage_path) return { id: row.id, title: row.title, url: mediaHref(row.id, type) };
  const source = videoSource(row.source_url);
  return source ? { id: row.id, title: row.title, url: source.url, embedded: source.embedded } : null;
}

async function embeddedVideoThumbnail(url: string): Promise<string | undefined> {
  const source = new URL(url);
  const id = source.pathname.split("/").at(-1);
  if (source.hostname === "www.youtube-nocookie.com") return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  if (source.hostname !== "player.vimeo.com") return;

  const endpoint = new URL("https://vimeo.com/api/oembed.json");
  const hash = source.searchParams.get("h");
  endpoint.searchParams.set("url", `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`);
  endpoint.searchParams.set("width", "640");
  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(1500),
      redirect: "error",
    });
    if (!response.ok) return;
    const data = await response.json();
    if (typeof data?.thumbnail_url !== "string") return;
    const thumbnail = new URL(data.thumbnail_url);
    if (thumbnail.origin === "https://i.vimeocdn.com" && !thumbnail.username && !thumbnail.password) return thumbnail.href;
  } catch {}
}

function displayText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function loadPublicRichProfile(vendor: PublicVendor) {
  const profile = await loadProfile(vendor.id);
  if (!profile?.active) return null;
  const [[row], mediaRows, adRows] = await Promise.all([
    findRows<VendorRow>("vendors", { id: `eq.${vendor.id}`, approved: "eq.true", select: vendorColumns, limit: "1" }),
    loadMedia(vendor.id), loadAds(vendor.id, { publicOnly: true }),
  ]);
  if (!row) return null;
  const content = readContent(profile);
  const { fields, categories, certificates, awards, memberships, socialLinks, news, claimStatus } = content;
  const imported = vendor.publicContact || {};
  const filledFacts = (entries: readonly { key: RichFieldKey; label: string }[]) => entries.flatMap(field => {
    const key = field.key;
    const value = fields[key];
    if ([
      "brandName", "tagline", "about", "website", "mapUrl", "hours", "udyam", "industry", "phone", "whatsapp", "email",
      "directorName", "directorRole", "publishDirector", "contactName", "contactRole", "publishContact", "publishProcurement",
    ].includes(key)) return [];
    if (Array.isArray(value) && value.length) return [{ label: field.label, value: value.join(", ") }];
    if (typeof value === "number" || typeof value === "string" || value === true) return [{ label: field.label, value: value === true ? "Yes" : String(value) }];
    return [];
  });
  const hasList = (key: RichFieldKey) => Array.isArray(fields[key]);
  const companyData = [
    ["Legal company name", row.company_name], ["Industry", fields.industry || displayText(imported.industry)],
    ["Business type", row.business_type], ["Registration type", row.registration_type], ["Established", row.year_of_incorporation],
    ["GST", maskRegistration(row.gst_number)], ["CIN", maskRegistration(row.cin_registration)], ["UDYAM", maskRegistration(fields.udyam)],
    ["Languages", row.language],
  ].flatMap(([label, value]) => typeof label === "string" && typeof value === "string" && value.trim() ? [{ label, value }] : [])
    .concat(filledFacts(RICH_FIELDS[0].fields));
  const commercial = [
    ["Production capacity", row.supply_capacity], ["Minimum order", row.moq], ["Export markets", row.export_markets],
    ["Payment terms", row.payment_terms],
    ...(!hasList("preferredIndustries") && row.target_industries ? [["Preferred buyer industries", row.target_industries]] : []),
    ...(!hasList("preferredGeography") && row.preferred_buyer_geography ? [["Preferred buyer geography", row.preferred_buyer_geography]] : []),
  ].flatMap(([label, value]) => label && value ? [{ label, value }] : [])
    .concat(filledFacts(RICH_FIELDS[2].fields), filledFacts(RICH_FIELDS[3].fields.filter(item => item.key !== "focusAreas")));

  const publicMedia = mediaRows.flatMap(item => {
    if (item.news_record_only) return [];
    if ((item.purpose === "director" && !fields.publishDirector) || (item.purpose === "contact" && !fields.publishContact)) return [];
    if (item.credential_record_only && !usesCredentialMedia(content, item.id, item.purpose)) return [];
    const asset = toPublicAsset(item, "asset");
    return asset ? [{ ...asset, purpose: item.purpose }] : [];
  });
  const ads = adRows.flatMap(item => {
    const asset = toPublicAsset(item, "ad");
    return asset ? [{ ...asset, kind: item.kind, linkUrl: safeWebUrl(item.link_url) }] : [];
  });
  const categoryIds = [...new Set(categories.map(item => item.categoryId))];
  const subIds = categories.flatMap(item => item.subcategoryId ? [item.subcategoryId] : []);
  const bodyIds = [...new Set(certificates.flatMap(item => item.bodyId ? [item.bodyId] : []))];
  const [categoryNames, subNames, bodyNames, media] = await Promise.all([
    categoryIds.length ? findRows<{ id: string; name: string }>("categories", { select: "id,name", id: `in.(${categoryIds})`, active: "eq.true" }) : [],
    subIds.length ? findRows<{ id: string; name: string }>("subcategories", { select: "id,name", id: `in.(${subIds})`, active: "eq.true" }) : [],
    bodyIds.length ? findRows<{ id: string; name: string }>("certifying_bodies", { select: "id,name", id: `in.(${bodyIds})` }) : [],
    Promise.all(publicMedia.map(async item => {
      if (!item.embedded || (item.purpose !== "intro" && item.purpose !== "video")) return item;
      return { ...item, thumbnailUrl: await embeddedVideoThumbnail(item.url) };
    })),
  ]);

  const field = (key: RichFieldKey) => displayText(fields[key]);
  const certificateCards = certificates.map(item => ({
    name: item.name, issuer: bodyNames.find(body => body.id === item.bodyId)?.name || item.issuer,
    number: item.number, scope: item.scope, issued: item.issued, expires: item.expires,
    proofUrl: safeWebUrl(item.proofUrl), documentUrl: media.find(asset => asset.id === item.documentId && asset.purpose === "credential")?.url,
  }));
  const legacySchema = z.object({
    name: z.string().trim().min(1), id: z.string().trim().nullish(), expiry: z.string().trim().nullish(),
  });
  const legacyCerts = (Array.isArray(row.additional_certs) ? row.additional_certs : []).flatMap(item => {
    const parsed = legacySchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
  const primaryCertificate = displayText(row.primary_sustainability_cert);
  const existingCards: { name: string; issuer?: string; documentUrl?: string; number?: string; expires?: string }[] = [
    ...(primaryCertificate ? [{
      name: primaryCertificate, issuer: row.issuing_body || "",
      documentUrl: safeWebUrl(row.certificate_file_url),
    }] : []),
    ...legacyCerts.map(cert => ({ name: cert.name, number: cert.id || undefined, expires: cert.expiry || undefined })),
  ];
  for (const card of existingCards) {
    const duplicate = certificateCards.some(item => item.name.toLowerCase() === card.name.toLowerCase() &&
      (!card.documentUrl || item.documentUrl === card.documentUrl) &&
      (card.number ? item.number === card.number : !card.expires || item.expires === card.expires));
    if (!duplicate) {
      certificateCards.push({
        name: card.name, issuer: card.issuer ?? "", number: card.number ?? "", scope: "",
        issued: "", expires: card.expires ?? "", proofUrl: undefined, documentUrl: card.documentUrl,
      });
    }
  }
  const email = field("email") || row.business_email;
  const linkedin = safeWebUrl(imported.linkedin);
  return {
    id: vendor.id, href: vendorHref(vendor.id, vendor.slug),
    name: field("brandName") || displayText(imported.brand) || vendor.companyName,
    logo: safeWebUrl(vendor.logoUrl), initials: vendor.logoText,
    tagline: field("tagline") || displayText(imported.tagline),
    description: field("about") || vendor.description,
    location: [vendor.city, vendor.state, vendor.country].filter(Boolean).join(", "),
    address: [row.registered_address, row.pin_code].filter(Boolean).join(" "),
    established: row.year_of_incorporation, claimRequested: vendor.isClaimRequested, unclaimed: vendor.isUnclaimed,
    claimed: vendor.isClaimed, verified: vendor.listingVerified,
    website: safeWebUrl(field("website") || imported.website), mapUrl: safeWebUrl(field("mapUrl") || imported.mapLink),
    hours: field("hours") || displayText(imported.operatingHours),
    phone: phoneDial(field("phone") || row.alternate_phone || imported.phone),
    whatsapp: phoneDial(field("whatsapp") || row.whatsapp),
    email: z.email().safeParse(email).success ? email : null,
    contact: fields.publishContact ? { name: field("contactName") || row.primary_contact_name, role: field("contactRole") || row.designation } : null,
    director: fields.publishDirector ? { name: field("directorName"), role: field("directorRole") } : null,
    socialLinks: [...socialLinks, ...(linkedin && !socialLinks.some(link => link.platform === "LinkedIn") ? [{ platform: "LinkedIn", url: linkedin }] : [])],
    categories: Array.from(new Set([
      vendor.category, ...(vendor.subCategories || []), ...categoryNames.map(item => item.name), ...subNames.map(item => item.name),
    ].filter((tag): tag is string => Boolean(tag)))),
    offerings: displayText(imported.productOfferings) || row.key_products?.join(", "),
    companyData, commercial,
    procurement: fields.publishProcurement ? filledFacts(RICH_FIELDS[4].fields) : [],
    sustainability: [
      ["Practices", row.sustainability_practice || displayText(imported.sustainability)],
      ["Recycled content", row.recycled_content], ["Carbon footprint", row.carbon_footprint],
      ["Social compliance", row.social_compliance], ["Net zero commitment", row.net_zero_commitment],
      ["Claim status", claimStatus || (certificateCards.some(item => item.documentUrl || item.proofUrl)
        ? "Evidence Uploaded" : row.sustainability_practice || hasList("focusAreas") ? "Self-Declared" : null)],
    ].flatMap(([label, value]) => value && label ? [{ label, value }] : [])
      .concat(filledFacts(RICH_FIELDS[3].fields.filter(item => item.key === "focusAreas"))),
    certificates: certificateCards,
    awards: awards.map(item => ({
      name: item.name, issuer: item.issuer, year: item.year, proofUrl: safeWebUrl(item.proofUrl),
      imageUrl: media.find(asset => asset.id === item.imageId && asset.purpose === "award")?.url,
    })),
    news: news.filter(item => item.published).reverse()
      .sort((first, second) => second.date.localeCompare(first.date))
      .map(({ id, headline, date, body, imageId, sourceUrl }) => ({
        id, headline, date, body, sourceUrl: safeWebUrl(sourceUrl),
        imageUrl: mediaRows.some(asset => asset.id === imageId && asset.news_record_only) ? mediaHref(imageId, "asset") : undefined,
      })),
    legacyAward: row.awards, legacyAwardImage: safeWebUrl(row.awards_image_url),
    memberships, caseStudies: row.case_studies, media, ads,
  };
}
