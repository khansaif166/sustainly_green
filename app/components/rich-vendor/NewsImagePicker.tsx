"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { ASSET_LIMIT_MB, ASSET_MIME_TYPES } from "@/lib/richVendorProfile";
import { getValidSession } from "@/lib/supabaseAuth";
import styles from "./editor.module.css";

export default function NewsImagePicker({ imageId, onUpload, onRemove }: {
  imageId: string; onUpload: (file: File) => Promise<string>; onRemove: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const [chosen, setChosen] = useState<{ url: string; name: string; uploadedId: string | null } | null>(null);
  const [remotePreview, setRemotePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [retry, setRetry] = useState(0);
  const localUrl = chosen?.url;
  const uploadedId = chosen?.uploadedId;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);

  useEffect(() => {
    if (!imageId || (localUrl && (!uploadedId || uploadedId === imageId))) {
      setPreviewLoading(false);
      return;
    }
    let active = true;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    setRemotePreview("");
    setPreviewError("");
    setPreviewLoading(true);
    void (async () => {
      try {
        const session = await getValidSession();
        if (!active) return;
        if (!session) throw new Error("Sign in again to preview this image.");
        const response = await fetch(`/api/rich-vendor-media/asset/${encodeURIComponent(imageId)}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }, signal: controller.signal,
        });
        if (!response.ok) throw new Error("Image preview is unavailable.");
        const blob = await response.blob();
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setRemotePreview(objectUrl);
      } catch (failure) {
        if (active) setPreviewError(failure instanceof Error ? failure.message : "Image preview is unavailable.");
      } finally {
        if (active) setPreviewLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId, localUrl, uploadedId, retry]);

  async function choose(file?: File) {
    if (!file || inFlight.current) return;
    if (!(ASSET_MIME_TYPES.image as readonly string[]).includes(file.type) || !file.size || file.size > ASSET_LIMIT_MB.image * 1024 * 1024) {
      setError(`Choose a JPG, PNG, or WebP image up to ${ASSET_LIMIT_MB.image} MB.`);
      return;
    }
    inFlight.current = true;
    setUploading(true);
    setError("");
    setPreviewError("");
    let selectedUrl: string | undefined;
    try {
      const url = URL.createObjectURL(file);
      selectedUrl = url;
      setChosen({ url, name: file.name, uploadedId: null });
      const nextId = await onUpload(file);
      if (mounted.current) setChosen({ url, name: file.name, uploadedId: nextId });
    } catch (failure) {
      if (selectedUrl) URL.revokeObjectURL(selectedUrl);
      if (mounted.current) {
        setChosen(null);
        setError(failure instanceof Error ? failure.message : "The image could not be uploaded. Try again.");
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setUploading(false);
    }
  }

  const localMatches = chosen && (!chosen.uploadedId || chosen.uploadedId === imageId);
  const source = localMatches ? chosen.url : imageId ? remotePreview : "";
  return <div className={styles.newsImageField} role="group" aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`}>
    <span id={`${id}-label`} className={styles.selectionLabel}>Update image<span className={styles.optionalLabel}>(optional)</span></span>
    <div className={styles.newsImagePicker} data-has-image={Boolean(source)} aria-busy={uploading || previewLoading}>
      {source ? <img className={styles.newsImagePreview} src={source} alt="Selected news update image" />
        : <div className={styles.newsImagePlaceholder}>{previewLoading ? <LoaderCircle className={styles.newsImageSpinner} size={24} aria-hidden="true" /> : <ImagePlus size={26} aria-hidden="true" />}</div>}
      <div className={styles.newsImageActions}>
        <span className={styles.newsImageName}>{localMatches ? chosen.name : imageId ? "Attached image" : "Choose a photo for this update"}</span>
        <input ref={input} type="file" hidden accept={ASSET_MIME_TYPES.image.join(",")} disabled={uploading} aria-label="Choose news update image"
          onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void choose(file); }} />
        <div className={styles.chips}>
          <button type="button" className={styles.small} disabled={uploading} onClick={() => input.current?.click()}>
            {uploading ? <LoaderCircle size={16} className={styles.newsImageSpinner} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
            {uploading ? "Uploading…" : imageId ? "Replace image" : "Choose image"}
          </button>
          {imageId && <button type="button" className={styles.socialRemove} disabled={uploading} onClick={() => {
            setChosen(null);
            setError("");
            setPreviewError("");
            onRemove();
          }}><Trash2 size={15} aria-hidden="true" />Remove</button>}
        </div>
        {uploading && <span className={styles.companyHelp} role="status">Uploading your image…</span>}
      </div>
    </div>
    <p id={`${id}-help`} className={styles.companyHelp}>JPG, PNG, or WebP · Up to {ASSET_LIMIT_MB.image} MB. Save profile details to apply image changes.</p>
    {error && <p className={styles.newsImageError} role="alert">{error}</p>}
    {previewError && !localMatches && imageId && <div className={styles.newsImageError} role="alert">{previewError} <button type="button" className={styles.hoursMode} onClick={() => setRetry(value => value + 1)}>Retry preview</button></div>}
  </div>;
}
