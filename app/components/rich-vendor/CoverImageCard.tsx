"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { ASSET_LIMIT_MB, ASSET_MIME_TYPES, type EditorMedia } from "@/lib/richVendorProfile";
import styles from "./coverImage.module.css";
import editor from "./editor.module.css";

export default function CoverImageCard({ item, editable, busy, save, preview }: {
  item?: EditorMedia; editable: boolean; busy: boolean;
  save: (input: Record<string, unknown> | FormData) => Promise<boolean>;
  preview: (item: EditorMedia) => ReactNode;
}) {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [phase, setPhase] = useState<"checking" | "saving" | "removing" | null>(null);
  const [error, setError] = useState("");
  const operation = useRef(false);
  const mounted = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const generatedTitle = useRef("");
  const locked = busy || phase !== null;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  function clear() {
    setFile(null); setUrl(""); setTitle(""); setDimensions(""); setError("");
    generatedTitle.current = "";
  }

  async function choose(next?: File) {
    if (!next || !editable || busy || operation.current) return;
    operation.current = true;
    setPhase("checking"); setError("");
    let candidate = "";
    try {
      if (!ASSET_MIME_TYPES.image.includes(next.type) || !next.size || next.size > ASSET_LIMIT_MB.image * 1024 * 1024) {
        throw new Error(`Choose a JPG, PNG or WebP image up to ${ASSET_LIMIT_MB.image} MB.`);
      }
      candidate = URL.createObjectURL(next);
      const image = new window.Image();
      image.src = candidate;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("Invalid image dimensions.");
      if (!mounted.current) return;
      const generated = next.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 120) || "Company cover image";
      const previous = generatedTitle.current;
      setTitle(current => !current.trim() || current === previous ? generated : current);
      generatedTitle.current = generated;
      setDimensions(`${image.naturalWidth} × ${image.naturalHeight} px`);
      setFile(next); setUrl(candidate);
      candidate = "";
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error && failure.message.startsWith("Choose ")
        ? failure.message : "This image could not be opened. Choose a valid JPG, PNG or WebP image.");
    } finally {
      if (candidate) URL.revokeObjectURL(candidate);
      operation.current = false;
      if (mounted.current) setPhase(null);
    }
  }

  return <section className={styles.card} aria-labelledby={`${id}-title`}>
    <header className={styles.coverHeader}>
      <div>
        <h4 id={`${id}-title`}>Cover image</h4>
        {editable && <p id={`${id}-help`}>1600 × 400 px recommended · JPG, PNG or WebP · Up to {ASSET_LIMIT_MB.image} MB</p>}
      </div>
      {editable && <button ref={chooseButton} className={file ? editor.adAction : editor.primary} type="button"
        aria-describedby={`${id}-help`} disabled={locked} onClick={() => input.current?.click()}>
        {phase === "checking" ? "Checking image…" : file ? "Choose another file" : item ? "Replace image" : "Choose image"}
      </button>}
    </header>
    <div className={styles.coverBody}>
      {item && <div className={styles.savedCover}>
        {preview(item)}
        <div className={styles.coverDetails}>
          <p>Current cover</p>
          <strong>{item.title}</strong>
        </div>
        {editable && !file && <button className={styles.coverRemove} type="button" disabled={locked} onClick={async () => {
          if (busy || operation.current || !window.confirm("Remove the current cover image?")) return;
          operation.current = true; setPhase("removing"); setError("");
          try { await save({ action: "delete_media", id: item.id }); }
          finally { operation.current = false; if (mounted.current) setPhase(null); }
        }}><Trash2 size={15} aria-hidden="true" />{phase === "removing" ? "Removing…" : "Remove cover image"}</button>}
      </div>}
      {!item && !file && <div className={styles.emptyCover}>
        <span className={editor.assetIcon}><ImageIcon size={21} aria-hidden="true" /></span>
        <p>No cover image yet</p>
      </div>}
      {editable && <form hidden={!file} aria-label={item ? "Replace cover image" : "Upload cover image"} aria-busy={locked} onSubmit={async event => {
        event.preventDefault();
        if (!file || !title.trim() || !editable || busy || operation.current) return;
        operation.current = true; setPhase("saving"); setError("");
        try {
          const form = new FormData();
          form.set("action", item ? "replace_cover" : "add_media");
          form.set("purpose", "cover"); form.set("title", title.trim()); form.set("sourceUrl", ""); form.set("file", file);
          if (item) form.set("id", item.id);
          if (await save(form)) { if (mounted.current) clear(); }
          else if (mounted.current) setError("The cover could not be saved. Your selection is ready to retry.");
        } finally { operation.current = false; if (mounted.current) setPhase(null); }
      }}>
        <fieldset disabled={locked}>
          <div hidden>
            <label htmlFor={`${id}-file`}>Cover image file</label>
            <input ref={input} id={`${id}-file`} type="file" accept={ASSET_MIME_TYPES.image.join(",")}
              onChange={event => { const next = event.target.files?.[0]; event.target.value = ""; void choose(next); }} />
          </div>
          {file && <div className={styles.pendingCover}>
            <div className={styles.pendingImage}>
              <figure className={styles.selection}><img src={url} alt={title || "Selected cover image"} /></figure>
              <div className={styles.coverDetails}>
                <p>New cover · Unsaved</p>
                <strong className={styles.pendingFilename} title={file.name}>{file.name}</strong>
                <p>{dimensions}</p>
              </div>
            </div>
            <label>Image description<input value={title} maxLength={120} required onChange={event => setTitle(event.target.value)} /></label>
            <div className={styles.coverActions}>
              <button className={editor.adAction} type="button" onClick={() => { clear(); chooseButton.current?.focus(); }}>Cancel</button>
              <button className={editor.primary} type="submit" disabled={!title.trim()}>
                <Upload size={16} aria-hidden="true" />{phase === "saving" ? "Saving…" : "Save cover"}
              </button>
            </div>
          </div>}
        </fieldset>
      </form>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  </section>;
}
