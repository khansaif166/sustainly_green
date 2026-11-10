"use client";

import { useEffect, useId, useRef } from "react";
import { IMAGE_HINT, MAX_PRODUCT_IMAGES } from "@/lib/productImages";
import ProductImageCropDialog from "./ProductImageCropDialog";
import type { ProductImage, ProductImagesController } from "./useProductImages";
import styles from "./productImages.module.css";

function ImageThumbnail({ image, index }: { image: ProductImage; index: number }) {
  const source = image.file ?? image.source;
  const element = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (typeof source === "string") return;
    const url = URL.createObjectURL(source);
    // Object URLs are owned by this thumbnail and released on replace/remove.
    if (element.current) element.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [source]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={element} className={styles.thumbnail} src={typeof source === "string" ? source : undefined} alt={`Product photo ${index + 1}`} />;
}

export default function ProductImagePicker({ controller, disabled = false, allowSelection = true }: {
  controller: ProductImagesController;
  disabled?: boolean;
  allowSelection?: boolean;
}) {
  const inputId = useId();
  const hintId = useId();
  // The modal makes the background inert. Keep its trigger enabled so the
  // browser can return focus to it when the editor closes.
  const locked = disabled || controller.preparing;
  const editing = controller.images.find(image => image.id === controller.editingId);

  return <div className={styles.picker}>
    <div className={styles.heading}><span>Product photos</span><span>{controller.images.length}/{MAX_PRODUCT_IMAGES}</span></div>
    {allowSelection && <label className={styles.upload} htmlFor={inputId} aria-disabled={locked || controller.images.length >= MAX_PRODUCT_IMAGES}>
      <span>{controller.preparing ? "Optimising photos…" : "+ Add photos"}</span>
      <input id={inputId} type="file" multiple accept="image/*" aria-describedby={hintId}
        disabled={locked || controller.images.length >= MAX_PRODUCT_IMAGES}
        onChange={event => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void controller.addImages(files);
        }} />
    </label>}
    <p id={hintId} className={styles.help}>{IMAGE_HINT} Use Edit crop to choose what buyers see.</p>
    {controller.errors.length > 0 && <div className={styles.error} role="alert">{controller.errors.map(message => <p key={message}>{message}</p>)}</div>}
    {controller.notes.length > 0 && <details className={styles.notes}><summary>Photo quality notes</summary>{controller.notes.map(message => <p key={message}>{message}</p>)}</details>}
    <div className={styles.images}>
      {controller.images.map((image, index) => <div key={image.id} className={`${styles.imageCard} ${controller.coverId === image.id ? styles.cover : ""}`}>
        <ImageThumbnail image={image} index={index} />
        {controller.coverId === image.id && <span className={styles.badge}>Cover photo</span>}
        {image.crop && <span className={styles.cropped}>Cropped</span>}
        <div className={styles.actions}>
          <button type="button" disabled={locked} onClick={() => controller.setEditingId(image.id)} aria-label={`Edit crop for photo ${index + 1}`}>Edit crop</button>
          <button type="button" disabled={locked || controller.coverId === image.id} onClick={() => controller.setCoverId(image.id)} aria-label={`Set photo ${index + 1} as cover`}>{controller.coverId === image.id ? "Cover selected" : "Set cover"}</button>
          {allowSelection && <button type="button" className={styles.remove} disabled={locked} onClick={() => controller.removeImage(image.id)} aria-label={`Remove photo ${index + 1}`}>Remove</button>}
        </div>
      </div>)}
    </div>
    {editing && <ProductImageCropDialog key={editing.id} image={editing} onClose={() => controller.setEditingId(null)}
      onApply={(file, original, crop) => controller.applyCrop(editing.id, file, original, crop)} />}
  </div>;
}
