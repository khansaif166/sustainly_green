"use client";

import { useCallback, useRef, useState } from "react";
import { MAX_PRODUCT_IMAGES, prepareProductImage } from "@/lib/productImages";
import type { ImageCrop } from "@/lib/productImageCrop";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

export type ProductImage = {
  id: string;
  source: File | string;
  originalFile?: File;
  file?: File;
  crop?: ImageCrop;
};

export function useProductImages() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const selecting = useRef(false);

  const setStoredImages = useCallback((urls: string[]) => {
    const items = urls.slice(0, MAX_PRODUCT_IMAGES).map(source => ({ id: crypto.randomUUID(), source }));
    setImages(items);
    setCoverId(items[0]?.id ?? null);
  }, []);

  async function addImages(files: File[]) {
    if (selecting.current) return;
    selecting.current = true;
    setPreparing(true);
    setErrors([]);
    setNotes([]);
    const remaining = MAX_PRODUCT_IMAGES - images.length;
    const accepted: ProductImage[] = [];
    const nextErrors: string[] = [];
    const nextNotes: string[] = [];
    try {
      for (const source of files.slice(0, remaining)) {
        try {
          const result = await prepareProductImage(source);
          if (!result) throw new Error("Unable to decode image");
          accepted.push({ id: crypto.randomUUID(), source, file: result.file });
          if (result.note) nextNotes.push(result.note);
        } catch {
          nextErrors.push(`"${source.name}" could not be read. Try a JPG, PNG or WebP image.`);
        }
      }
      if (files.length > remaining) nextErrors.push(`A product can have at most ${MAX_PRODUCT_IMAGES} images. Extra files were not added.`);
      setImages(previous => [...previous, ...accepted].slice(0, MAX_PRODUCT_IMAGES));
      setErrors(nextErrors);
      setNotes(nextNotes);
    } finally {
      selecting.current = false;
      setPreparing(false);
    }
  }

  function removeImage(id: string) {
    setImages(previous => previous.filter(image => image.id !== id));
    if (coverId === id) setCoverId(null);
  }

  function applyCrop(id: string, file: File, originalFile: File, crop?: ImageCrop) {
    setImages(previous => previous.map(image => image.id === id ? {
      ...image,
      originalFile,
      file: !crop && typeof image.source === "string" ? undefined : file,
      crop,
    } : image));
    setNotes([]);
    setEditingId(null);
  }

  async function uploadImages(accessToken: string) {
    const urls = await Promise.all(images.map(async image => {
      if (image.file) {
        const uploaded = await uploadFileToSupabaseStorage(image.file, { bucket: "marketplace", folder: "products", accessToken });
        return uploaded.url;
      }
      if (typeof image.source === "string") return image.source;
      throw new Error("A photo is still being prepared. Please try again.");
    }));
    const coverIndex = Math.max(0, images.findIndex(image => image.id === coverId));
    return [urls[coverIndex], ...urls.filter((_, index) => index !== coverIndex)].filter((url): url is string => Boolean(url));
  }

  return {
    images, coverId: coverId ?? images[0]?.id, setCoverId, editingId, setEditingId,
    preparing, busy: preparing || editingId !== null, errors, notes,
    setStoredImages, addImages, removeImage, applyCrop, uploadImages,
  };
}

export type ProductImagesController = ReturnType<typeof useProductImages>;
