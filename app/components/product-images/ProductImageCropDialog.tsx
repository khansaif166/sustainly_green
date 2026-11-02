"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clampPosition, cropProductImage, DEFAULT_IMAGE_CROP, getCropGeometry, loadCropImage, loadCropSource, type ImageCrop } from "@/lib/productImageCrop";
import { prepareProductImage } from "@/lib/productImages";
import type { ProductImage } from "./useProductImages";
import styles from "./productImages.module.css";

type LoadedSource = { file: File; url: string; width: number; height: number };

export default function ProductImageCropDialog({ image, onApply, onClose }: {
  image: ProductImage;
  onApply: (file: File, originalFile: File, crop?: ImageCrop) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; crop: ImageCrop } | null>(null);
  const titleId = useId();
  const hintId = useId();
  const [crop, setCrop] = useState<ImageCrop>(image.crop ?? { ...DEFAULT_IMAGE_CROP });
  const [loaded, setLoaded] = useState<LoadedSource | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const source = image.originalFile ?? image.source;

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    async function load() {
      try {
        const file = await loadCropSource(source, controller.signal);
        const decoded = await loadCropImage(file);
        if (!active) return;
        objectUrl = URL.createObjectURL(file);
        setLoaded({ file, url: objectUrl, width: decoded.naturalWidth, height: decoded.naturalHeight });
      } catch {
        if (active) setLoadError("We could not load this photo for editing. Your current photo is unchanged. Please retry or choose another photo.");
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, retry]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [loaded]);

  async function apply(useOriginal = false) {
    if (!loaded || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const file = useOriginal
        ? (await prepareProductImage(loaded.file))?.file
        : await cropProductImage(loaded.file, crop);
      if (!file) throw new Error("This photo could not be prepared. Please try another photo.");
      onApply(file, loaded.file, useOriginal ? undefined : crop);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to crop this photo. Please retry.");
      setSaving(false);
    }
  }

  const geometry = loaded ? getCropGeometry(loaded.width, loaded.height, crop) : null;
  const previewScale = geometry ? viewportWidth / geometry.width : 1;

  return createPortal(
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={hintId}
      onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}>
      <div className={styles.dialogHeader}>
        <div>
          <h2 id={titleId}>Crop product photo</h2>
          <p id={hintId}>Drag or use arrow keys to position. Your crop will be 3:2.</p>
        </div>
        <button type="button" className={styles.close} aria-label="Close crop editor" disabled={saving} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </div>

      {!loaded && !loadError && <p className={styles.status} role="status">Loading photo…</p>}
      {loadError && <div className={styles.status}>
        <p className={styles.error} role="alert">{loadError}</p>
        <button type="button" className={styles.secondary} onClick={() => { setLoadError(""); setRetry(value => value + 1); }}>Retry loading photo</button>
      </div>}

      {loaded && geometry && <>
        <div className={styles.cropViewport} ref={viewport} tabIndex={0} role="group" aria-label="Photo position. Use arrow keys to move the photo."
          aria-disabled={saving}
          onKeyDown={event => {
            if (saving || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            const step = event.shiftKey ? 0.02 : 0.1;
            setCrop(previous => ({ ...previous,
              x: clampPosition(previous.x + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0)),
              y: clampPosition(previous.y + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0)),
            }));
          }}
          onPointerDown={event => {
            if (saving || event.button !== 0) return;
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, crop };
          }}
          onPointerMove={event => {
            const start = drag.current;
            if (!start || start.pointerId !== event.pointerId || saving) return;
            const initial = getCropGeometry(loaded.width, loaded.height, start.crop);
            const scale = viewportWidth / initial.width;
            setCrop({ ...start.crop,
              x: initial.overflowX > 0 ? clampPosition(start.crop.x + (event.clientX - start.x) / (initial.overflowX * scale)) : 0,
              y: initial.overflowY > 0 ? clampPosition(start.crop.y + (event.clientY - start.y) / (initial.overflowY * scale)) : 0,
            });
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onLostPointerCapture={() => { drag.current = null; }}>
          {/* A native image keeps preview/export orientation consistent. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={loaded.url} alt="Photo crop preview" draggable={false} style={{
            width: loaded.width * previewScale, height: loaded.height * previewScale,
            transform: `translate(-50%, -50%) translate(${geometry.offsetX * previewScale}px, ${geometry.offsetY * previewScale}px) rotate(${crop.rotation}deg)`,
          }} />
          <div className={styles.grid} aria-hidden="true" />
        </div>
        <div className={styles.controls}>
          <label>Zoom <span>{crop.zoom.toFixed(1)}×</span>
            <input type="range" min={1} max={3} step={0.01} value={crop.zoom} disabled={saving}
              onChange={event => setCrop(previous => ({ ...previous, zoom: Number(event.target.value) }))} />
          </label>
          <div className={styles.toolbar}>
            <button type="button" className={styles.secondary} disabled={saving} onClick={() => setCrop(previous => ({ ...previous, rotation: ((previous.rotation + 90) % 360) as ImageCrop["rotation"], x: 0, y: 0 }))}>Rotate 90°</button>
            <button type="button" className={styles.secondary} disabled={saving} onClick={() => setCrop({ ...DEFAULT_IMAGE_CROP })}>Reset crop</button>
          </div>
          <p className={styles.help}>Cropping is optional. Use original photo to keep the full image. Photos upload only when you save the product.</p>
          {saveError && <p className={styles.error} role="alert">{saveError}</p>}
        </div>
      </>}
      <div className={styles.dialogFooter}>
        <button type="button" className={styles.secondary} disabled={saving} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.secondary} disabled={!loaded || saving} onClick={() => void apply(true)}>Use original photo</button>
        <button type="button" className={styles.primary} disabled={!loaded || saving} onClick={() => void apply()}>{saving ? "Preparing…" : "Apply crop"}</button>
      </div>
    </dialog>, document.body,
  );
}
