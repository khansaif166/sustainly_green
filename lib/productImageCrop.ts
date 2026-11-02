import { MAX_EDGE, MAX_IMAGE_BYTES, MAX_PIXELS, TARGET_ASPECT } from "./productImages";

export type ImageCrop = {
  rotation: 0 | 90 | 180 | 270;
  zoom: number;
  x: number;
  y: number;
};

export const DEFAULT_IMAGE_CROP: ImageCrop = { rotation: 0, zoom: 1, x: 0, y: 0 };

export function clampPosition(value: number) {
  return Math.max(-1, Math.min(1, value));
}

// Coordinates are relative to the rotated source, so preview and export use
// the same geometry at every viewport size. Positive offsets move the image.
export function getCropGeometry(width: number, height: number, crop: ImageCrop) {
  const rotated = crop.rotation === 90 || crop.rotation === 270;
  const rotatedWidth = rotated ? height : width;
  const rotatedHeight = rotated ? width : height;
  const cropWidth = Math.min(rotatedWidth, rotatedHeight * TARGET_ASPECT) / Math.max(1, Math.min(3, crop.zoom));
  const cropHeight = cropWidth / TARGET_ASPECT;
  return {
    width: cropWidth,
    height: cropHeight,
    overflowX: (rotatedWidth - cropWidth) / 2,
    overflowY: (rotatedHeight - cropHeight) / 2,
    offsetX: clampPosition(crop.x) * (rotatedWidth - cropWidth) / 2,
    offsetY: clampPosition(crop.y) * (rotatedHeight - cropHeight) / 2,
  };
}

export async function loadCropSource(source: File | string, signal?: AbortSignal): Promise<File> {
  if (typeof source !== "string") return source;
  const response = await fetch(source, { mode: "cors", signal });
  if (!response.ok) throw new Error("The saved photo could not be loaded. Please retry.");
  const blob = await response.blob();
  return new File([blob], "product-image", { type: blob.type });
}

export function loadCropImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This photo could not be decoded. Try a JPG, PNG or WebP image.")); };
    image.src = url;
  });
}

export async function cropProductImage(file: File, crop: ImageCrop): Promise<File> {
  const image = await loadCropImage(file);
  const geometry = getCropGeometry(image.naturalWidth, image.naturalHeight, crop);
  const scale = Math.min(1, MAX_EDGE / geometry.width, MAX_EDGE / geometry.height, Math.sqrt(MAX_PIXELS / (geometry.width * geometry.height)));
  const canvas = document.createElement("canvas");
  // Export directly from the original source; never re-encode a previous crop.
  // PNG is a lossless fallback for browsers without WebP (including alpha).
  for (const reduction of [1, 0.7, 0.49]) {
    // Multiples of 3 and 2 preserve an exact 3:2 ratio after rounding.
    const width = Math.max(3, Math.floor(geometry.width * scale * reduction / 3) * 3);
    canvas.width = width;
    canvas.height = width / 3 * 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image editing is unavailable in this browser.");
    const outputScale = width / geometry.width;
    context.imageSmoothingQuality = "high";
    context.translate(width / 2 + geometry.offsetX * outputScale, canvas.height / 2 + geometry.offsetY * outputScale);
    context.rotate(crop.rotation * Math.PI / 180);
    context.drawImage(image, -image.naturalWidth * outputScale / 2, -image.naturalHeight * outputScale / 2, image.naturalWidth * outputScale, image.naturalHeight * outputScale);
    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= MAX_IMAGE_BYTES) {
        const extension = blob.type === "image/webp" ? "webp" : "png";
        return new File([blob], `${file.name.replace(/\.[^./\\]+$/, "")}-cropped.${extension}`, { type: blob.type });
      }
      // PNG has no quality setting: reduce dimensions instead of encoding it
      // repeatedly at the same size.
      if (blob?.type === "image/png") break;
    }
  }
  throw new Error("The cropped photo is too large. Try zooming in or using a smaller photo.");
}
