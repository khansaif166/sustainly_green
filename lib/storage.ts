// lib/storage.ts

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type UploadOptions = {
  bucket: "marketplace" | "vendor-private" | "resumes";
  folder: string;
  accessToken?: string;
  upsert?: boolean;
  allowedTypes?: string[];
};

const BUCKET_ALLOWED_TYPES: Record<string, string[]> = {
  marketplace: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
  "vendor-private": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  resumes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

export type StorageUploadResult = {
  url: string;
  path: string;
  bucket: string;
};

function requireStorageConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase public environment variables.");
  }
}

function getSupabaseBaseUrl() {
  requireStorageConfig();
  return SUPABASE_URL!
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/auth\/v1\/?$/, "")
    .replace(/\/storage\/v1\/?$/, "")
    .replace(/\/$/, "");
}

function sanitizeFileName(name: string) {
  const parts = name.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()}` : "";
  const base = parts
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${base || "file"}${extension.toLowerCase()}`;
}

function createStoragePath(folder: string, file: File) {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${cleanFolder}/${id}-${sanitizeFileName(file.name)}`;
}

export function getPublicStorageUrl(bucket: string, path: string) {
  return `${getSupabaseBaseUrl()}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadFileToSupabaseStorage(
  file: File,
  options: UploadOptions,
  onProgress?: (percent: number) => void,
): Promise<StorageUploadResult> {
  requireStorageConfig();

  const allowed = options.allowedTypes ?? BUCKET_ALLOWED_TYPES[options.bucket];
  if (allowed && file.type && !allowed.includes(file.type)) {
    throw new Error(
      `File type "${file.type}" is not allowed. Accepted: ${allowed.join(", ")}`,
    );
  }

  onProgress?.(0);

  const baseUrl = getSupabaseBaseUrl();
  const path = createStoragePath(options.folder, file);
  const token = options.accessToken || SUPABASE_ANON_KEY!;

  const response = await fetch(
    `${baseUrl}/storage/v1/object/${options.bucket}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": options.upsert ? "true" : "false",
      },
      body: file,
    },
  );

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string; error?: string };
      message = parsed.message || parsed.error || raw;
    } catch {}
    throw new Error(message || `Storage upload failed: ${response.status}`);
  }

  onProgress?.(100);

  return {
    bucket: options.bucket,
    path,
    url:
      options.bucket === "marketplace"
        ? getPublicStorageUrl(options.bucket, path)
        : "",
  };
}

export async function uploadFileWithProgress(
  file: File,
  path: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const folder = path.includes("/")
    ? path.replace(/\/[^/]*$/, "")
    : "uploads";

  const result = await uploadFileToSupabaseStorage(
    file,
    {
      bucket: "marketplace",
      folder,
      upsert: false,
    },
    onProgress,
  );

  return result.url;
}
