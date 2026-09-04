// lib/productImages.ts
//
// Vendor product images are normalized in the browser before upload: whatever a
// vendor picks gets decoded, downscaled to a sane edge length and re-encoded
// until it fits the size budget. Nothing is rejected for being too big or the
// wrong shape — only files the browser genuinely cannot decode as an image.

export const MAX_PRODUCT_IMAGES = 5;

// Ceiling for what actually reaches storage.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Longest side after normalization. The detail hero renders around 700px wide,
// so 2000 leaves plenty of headroom for retina without shipping camera-sized
// files to buyers on mobile data.
export const MAX_EDGE = 2000;

// Capping only the long edge would flatten a panorama: 10000×200 would come out
// 2000×40. The short edge is held above this floor (never upscaling past the
// source), and total pixels are capped separately — iOS Safari refuses to
// rasterize canvases much beyond ~16M pixels.
export const MAX_PIXELS = MAX_EDGE * MAX_EDGE;

// Below this the source is too small to look good; we still accept it, just
// flag it, since upscaling would only add blur.
export const MIN_USEFUL_EDGE = 600;

// The detail hero renders at aspect-[3/2] with object-cover, so images far from
// 3:2 lose their edges on display. Advisory only — we never crop the file.
export const TARGET_ASPECT = 3 / 2;
export const ASPECT_TOLERANCE = 0.08;

export const RECOMMENDED_WIDTH = 1200;
export const RECOMMENDED_HEIGHT = 800;

export const IMAGE_HINT = `Any photo works — we resize and compress it for you. ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT} (3:2) looks best.`;

export type PreparedImage = {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
  bytes: number;
  resized: boolean;
  note?: string;
};

export type ProcessResult = {
  accepted: PreparedImage[];
  errors: string[];
  notes: string[];
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function replaceExtension(name: string, extension: string) {
  const base = name.replace(/\.[^./\\]+$/, "") || "image";
  return `${base}.${extension}`;
}

let webpSupport: boolean | null = null;
function supportsWebp() {
  if (webpSupport !== null) return webpSupport;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return webpSupport;
}

/**
 * Decodes a file to a bitmap. createImageBitmap applies EXIF orientation, so
 * portrait phone photos don't come out sideways; the <img> path is a fallback
 * for browsers that reject the options bag.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to the <img> path.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement | null>(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dimensionsOf(source: ImageBitmap | HTMLImageElement) {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

function drawToBlob(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  type: string,
  quality: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
}

/**
 * Normalizes one image: caps the longest edge at MAX_EDGE, then steps quality
 * (and finally scale) down until the encoded result fits MAX_IMAGE_BYTES.
 * Aspect ratio is always preserved — the file is never cropped.
 */
export async function prepareProductImage(file: File): Promise<PreparedImage | null> {
  const source = await decode(file);
  if (!source) return null;

  const { width: sourceWidth, height: sourceHeight } = dimensionsOf(source);
  if (!sourceWidth || !sourceHeight) return null;

  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  const extension = type === "image/webp" ? "webp" : "jpg";

  let scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));

  // Don't let a wide or tall image lose its short side to the long-edge cap.
  const shortest = Math.min(sourceWidth, sourceHeight);
  const shortFloor = Math.min(shortest, MIN_USEFUL_EDGE);
  if (shortest * scale < shortFloor) scale = shortFloor / shortest;

  // Then keep the raster within a size every browser will actually produce.
  const pixels = sourceWidth * sourceHeight * scale * scale;
  if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);

  let best: { blob: Blob; width: number; height: number } | null = null;

  // Two scale passes are enough in practice: the first at the capped edge, a
  // second at 70% for the rare image that is still too heavy at low quality.
  for (let attempt = 0; attempt < 2 && !best; attempt++) {
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      const blob = await drawToBlob(source, width, height, type, quality);
      if (!blob) break;
      if (blob.size <= MAX_IMAGE_BYTES) {
        best = { blob, width, height };
        break;
      }
      best = null;
    }

    scale *= 0.7;
  }

  if ("close" in source && typeof source.close === "function") source.close();

  if (!best) return null;

  const resized = best.width !== sourceWidth || best.height !== sourceHeight;
  const prepared: PreparedImage = {
    file: new File([best.blob], replaceExtension(file.name, extension), {
      type,
      lastModified: Date.now(),
    }),
    width: best.width,
    height: best.height,
    originalBytes: file.size,
    bytes: best.blob.size,
    resized,
  };

  const aspect = best.width / best.height;
  const longestEdge = Math.max(best.width, best.height);

  if (longestEdge < MIN_USEFUL_EDGE) {
    prepared.note = `"${file.name}" is only ${best.width}×${best.height} and will look soft. A larger photo works better.`;
  } else if (Math.abs(aspect - TARGET_ASPECT) / TARGET_ASPECT > ASPECT_TOLERANCE) {
    prepared.note = `"${file.name}" isn't 3:2, so listings will crop its edges. ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT} shows the whole photo.`;
  } else if (resized) {
    prepared.note = `"${file.name}" resized to ${best.width}×${best.height} (${formatBytes(file.size)} → ${formatBytes(best.blob.size)}).`;
  }

  return prepared;
}

/**
 * Prepares a batch of picked files. `remainingSlots` is how many more images
 * the product can still hold.
 */
export async function processProductImages(
  files: File[],
  remainingSlots: number,
): Promise<ProcessResult> {
  const errors: string[] = [];
  const notes: string[] = [];
  const prepared: PreparedImage[] = [];

  // Trim to the free slots before decoding — resizing files we would only throw
  // away costs a vendor seconds of spinner for nothing.
  const queue = files.slice(0, Math.max(0, remainingSlots));

  for (const file of queue) {
    let result: PreparedImage | null = null;
    try {
      result = await prepareProductImage(file);
    } catch {
      result = null;
    }

    if (!result) {
      errors.push(`"${file.name}" couldn't be read as an image. Try a JPG, PNG or WEBP.`);
      continue;
    }
    prepared.push(result);
  }

  prepared.forEach(item => {
    if (item.note) notes.push(item.note);
  });

  const dropped = files.length - queue.length;
  if (dropped > 0) {
    errors.push(`${dropped} image${dropped > 1 ? "s were" : " was"} not added — a product can have at most ${MAX_PRODUCT_IMAGES}.`);
  }

  return { accepted: prepared, errors, notes };
}
