"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BookOpen, CheckCircle2, ChevronDown, Download, FileText, Leaf, LoaderCircle, Trash2, Upload } from "lucide-react";
import { ASSET_LIMIT_MB, MEDIA, type EditorMedia } from "@/lib/richVendorProfile";
import { getValidSession } from "@/lib/supabaseAuth";
import styles from "./editor.module.css";

export default function SingleDocumentCard({ purpose, items, editable, busy, onSave, preview, active = true }: {
  purpose: "brochure" | "report"; items: EditorMedia[]; editable: boolean; busy: boolean; active?: boolean;
  onSave: (input: Record<string, unknown> | FormData) => Promise<boolean>;
  preview: (item: EditorMedia) => ReactNode;
}) {
  const id = useId();
  const brochure = purpose === "brochure";
  const Icon = brochure ? BookOpen : Leaf;
  const heading = brochure ? "Company brochure / catalogue" : "Sustainability report or policy";
  const limit = MEDIA[purpose].limit;
  const canAdd = items.length < limit;
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [action, setAction] = useState<"upload" | "download" | "remove" | "validate" | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDetailsElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const confirmButton = useRef<HTMLButtonElement>(null);
  const generatedTitle = useRef("");
  const operation = useRef(false);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);
  const locked = busy || Boolean(action);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); };
  }, []);
  useEffect(() => { if (confirming && !locked) confirmButton.current?.focus(); }, [confirming, locked]);
  useEffect(() => { if (!active && card.current) card.current.open = false; }, [active]);

  async function choose(next?: File) {
    if (!next || busy || operation.current || !editable || !canAdd) return;
    operation.current = true;
    setAction("validate"); setError(""); setNotice("");
    try {
      if ((next.type && next.type !== "application/pdf") || !next.size || next.size > ASSET_LIMIT_MB.pdf * 1024 * 1024) {
        throw new Error(`Choose a PDF up to ${ASSET_LIMIT_MB.pdf} MB.`);
      }
      const signature = new Uint8Array(await next.slice(0, 5).arrayBuffer());
      if (String.fromCharCode(...signature) !== "%PDF-") throw new Error("This file does not appear to be a valid PDF.");
      if (!mounted.current) return;
      const previous = generatedTitle.current;
      const generated = next.name.replace(/\.pdf$/i, "").replace(/_/g, " ").trim().slice(0, 120) || heading;
      setFile(next.type ? next : new File([next], next.name, { type: "application/pdf", lastModified: next.lastModified }));
      setTitle(current => !current.trim() || current === previous ? generated : current);
      generatedTitle.current = generated;
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "This PDF could not be read. Choose another file.");
    } finally {
      operation.current = false;
      if (mounted.current) setAction(null);
    }
  }

  async function download(item: EditorMedia) {
    if (busy || operation.current) return;
    operation.current = true;
    setActiveFile(item.id);
    setAction("download"); setError(""); setNotice("");
    const controller = new AbortController();
    request.current = controller;
    try {
      const session = await getValidSession();
      if (!mounted.current) return;
      if (!session) throw new Error("Sign in again to download this PDF.");
      const response = await fetch(`/api/rich-vendor-media/asset/${encodeURIComponent(item.id)}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }, signal: controller.signal,
      });
      if (!response.ok) throw new Error("The PDF could not be downloaded. Try again.");
      const blob = await response.blob();
      if (!mounted.current) return;
      if (!blob.size) throw new Error("This PDF is empty.");
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        const name = item.title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim() || "Document";
        link.download = /\.pdf$/i.test(name) ? name : `${name}.pdf`;
        document.body.appendChild(link);
        try { link.click(); } finally { link.remove(); }
      } finally { window.setTimeout(() => URL.revokeObjectURL(url), 30_000); }
      setNotice("Download started.");
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "The PDF could not be downloaded. Try again.");
    } finally {
      operation.current = false;
      if (mounted.current) { setAction(null); setActiveFile(null); }
    }
  }

  async function remove(item: EditorMedia) {
    if (busy || operation.current || !editable || confirming !== item.id) return;
    operation.current = true;
    setActiveFile(item.id);
    setAction("remove"); setError(""); setNotice("");
    try {
      if (!await onSave({ action: "delete_media", id: item.id })) throw new Error("The PDF could not be removed. Try again.");
      if (mounted.current) { setConfirming(null); setNotice("PDF removed. You can upload a new document."); }
      const index = items.findIndex(row => row.id === item.id);
      const next = items[index + 1] || items[index - 1];
      requestAnimationFrame(() => (next && removeButtons.current.get(next.id) || chooseButton.current || card.current?.querySelector("summary"))?.focus());
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "The PDF could not be removed.");
    } finally { operation.current = false; if (mounted.current) { setAction(null); setActiveFile(null); } }
  }

  return <details ref={card} className={styles.singleDocumentCard} aria-labelledby={`${id}-title`}>
    <summary className={styles.singleDocumentHeader}>
      <span className={styles.assetIcon}><Icon size={22} aria-hidden="true" /></span>
      <div><h4 id={`${id}-title`}>{heading}</h4><p>{brochure ? "Introduce your company, products, and services to buyers." : "Share your sustainability commitments, report, or company policy."}</p></div>
      <span className={styles.assetStatus} data-uploaded={items.length > 0} aria-label={`${items.length} of ${limit} PDFs uploaded`}>
        {items.length > 0 && <CheckCircle2 size={14} aria-hidden="true" />}{items.length ? "Uploaded" : "No PDF yet"}</span>
      <ChevronDown className={styles.assetChevron} size={18} aria-hidden="true" />
    </summary>
    <div className={styles.singleDocumentBody}>
      {items.map(item => <div key={item.id} className={styles.singleDocumentFile}>
        <div className={styles.singleDocumentFileInfo}><FileText size={24} aria-hidden="true" /><div><h5>{item.title}</h5><p>PDF document</p></div></div>
        <div className={styles.singleDocumentActions}>
          {preview(item)}
          <button type="button" className={styles.adAction} disabled={locked} onClick={() => void download(item)} aria-label={`Download ${item.title}`}>
            {action === "download" && activeFile === item.id ? <LoaderCircle className={styles.singleDocumentSpinner} size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}{action === "download" && activeFile === item.id ? "Downloading…" : "Download"}</button>
          {editable && <button ref={node => { if (node) removeButtons.current.set(item.id, node); else removeButtons.current.delete(item.id); }} type="button" className={styles.assetRemove} disabled={locked} onClick={() => { setConfirming(item.id); setError(""); setNotice(""); }} aria-label={`Remove ${item.title}`}><Trash2 size={16} aria-hidden="true" />Remove</button>}
        </div>
        {confirming === item.id && <div className={styles.documentConfirm} role="group" aria-label={`Confirm removal of ${item.title}`}>
          <p>Remove “{item.title}”? It will no longer be available on this profile.</p>
          <div className={styles.singleDocumentActions}><button ref={confirmButton} type="button" className={styles.assetRemove} disabled={locked} onClick={() => void remove(item)}>{action === "remove" ? "Removing…" : "Remove PDF"}</button>
            <button type="button" className={styles.adAction} disabled={locked} onClick={() => { setConfirming(null); removeButtons.current.get(item.id)?.focus(); }}>Cancel</button></div>
        </div>}
      </div>)}
      {canAdd && editable && <form className={styles.singleDocumentUpload} aria-busy={action === "upload"} onSubmit={async event => {
        event.preventDefault();
        if (locked || operation.current || !file || !title.trim() || !canAdd || !editable) return;
        operation.current = true;
        setAction("upload"); setError(""); setNotice("");
        try {
          const form = new FormData();
          form.set("action", "add_media"); form.set("purpose", purpose); form.set("title", title.trim()); form.set("file", file); form.set("sourceUrl", "");
          if (!await onSave(form)) throw new Error("The PDF could not be uploaded. Your selection is ready to retry.");
          if (mounted.current) { setFile(null); setTitle(""); generatedTitle.current = ""; setNotice("PDF uploaded."); }
        } catch (failure) {
          if (mounted.current) setError(failure instanceof Error ? failure.message : "The PDF could not be uploaded. Try again.");
        } finally { operation.current = false; if (mounted.current) setAction(null); }
      }}>
        <fieldset disabled={locked}>
          <div className={styles.singleDocumentPicker}><FileText size={28} aria-hidden="true" /><div><strong>{file ? file.name : "Add your PDF document"}</strong><p>{file ? `${file.size < 1024 * 1024 ? `${Math.ceil(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`} · PDF` : `One PDF · Up to ${ASSET_LIMIT_MB.pdf} MB`}</p></div>
            <input ref={input} type="file" hidden accept="application/pdf" aria-label={`Choose PDF for ${heading}`} onChange={event => { const next = event.target.files?.[0]; event.target.value = ""; void choose(next); }} />
            <button ref={chooseButton} className={styles.adAction} type="button" onClick={() => input.current?.click()}>{action === "validate" ? "Checking…" : file ? "Change PDF" : "Choose PDF"}</button></div>
          {file && <label>Document title<input value={title} maxLength={120} required placeholder="A title buyers will recognise" onChange={event => setTitle(event.target.value)} /></label>}
          <div className={styles.singleDocumentActions}><button className={styles.primary} type="submit" disabled={!file || !title.trim()}>{action === "upload" ? <LoaderCircle className={styles.singleDocumentSpinner} size={16} aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}{action === "upload" ? "Uploading…" : "Upload PDF"}</button>
            {file && <button type="button" className={styles.adAction} onClick={() => { setFile(null); setTitle(""); generatedTitle.current = ""; setError(""); }}>Clear selection</button>}</div>
        </fieldset>
      </form>}
      {!items.length && !editable && <p className={styles.companyHelp}>No document has been uploaded.</p>}
      <div className={styles.singleDocumentFooter}>
        <span>PDF only · Maximum {ASSET_LIMIT_MB.pdf} MB</span>
        {editable && <span>Uploads and removals save immediately.</span>}
      </div>
      {error && <p className={styles.newsImageError} role="alert">{error}</p>}
      <p className={styles.documentNotice} role="status">{notice}</p>
    </div>
  </details>;
}
