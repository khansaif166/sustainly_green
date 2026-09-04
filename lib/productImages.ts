// lib/productImages.ts
//
// Client-side screening for vendor product images. The storage helper only
// checks MIME type, so size and dimension rules live here and run before an
// upload is ever attempted.

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// The product detail hero renders at aspect-[3/2] with object-cover, and browse
// cards crop to the same shape, so anything far off 3:2 loses its edges.
export const TARGET_ASPECT = 3 / 2;
// Tight enough to catch 4:3 (1.33, the default iPhone photo) and 16:9 (1.78),
// both of which visibly lose edges in a 3:2 frame. 16:10 (1.6) still passes.
export const ASPECT_TOLERANCE = 0.08;

export const RECOMMENDED_WIDTH = 1200;
export const RECOMMENDED_HEIGHT = 800;
export const MIN_WIDTH = 600;
export const MIN_HEIGHT = 400;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const IMAGE_HINT = `JPG, PNG or WEBP · ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT} (3:2) recommended · up to 5MB each`;

export type ImageScreenResult = {
  accepted: File[];
  errors: string[];
  warnings: string[];
};

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function readDimensions(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<{ width: number; height: number } | null>(resolve => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Screens picked files against the type, size and dimension rules.
 * `remainingSlots` is how many more images the product can still hold.
 */
export async function screenProductImages(
  files: File[],
  remainingSlots: number,
): Promise<ImageScreenResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const passed: File[] = [];

  for (const file of files) {
    if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      errors.push(`"${file.name}" is ${file.type || "an unsupported format"}. Use JPG, PNG or WEBP.`);
      continue;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      errors.push(`"${file.name}" is ${formatMb(file.size)}. Images must be under ${formatMb(MAX_IMAGE_BYTES)}.`);
      continue;
    }

    const dimensions = await readDimensions(file);
    if (!dimensions) {
      errors.push(`"${file.name}" could not be read as an image.`);
      continue;
    }

    const { width, height } = dimensions;
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      errors.push(`"${file.name}" is ${width}×${height}. Minimum is ${MIN_WIDTH}×${MIN_HEIGHT}.`);
      continue;
    }

    const aspect = width / height;
    if (Math.abs(aspect - TARGET_ASPECT) / TARGET_ASPECT > ASPECT_TOLERANCE) {
      warnings.push(`"${file.name}" is ${width}×${height}. Listings crop to 3:2, so parts of this image will be cut off — ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT} works best.`);
    } else if (width < RECOMMENDED_WIDTH) {
      warnings.push(`"${file.name}" is ${width}×${height} and may look soft on large screens. ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT} works best.`);
    }

    passed.push(file);
  }

  const accepted = passed.slice(0, Math.max(0, remainingSlots));
  if (passed.length > accepted.length) {
    const dropped = passed.length - accepted.length;
    errors.push(`${dropped} image${dropped > 1 ? "s were" : " was"} not added — a product can have at most ${MAX_PRODUCT_IMAGES}.`);
  }

  return { accepted, errors, warnings };
}
