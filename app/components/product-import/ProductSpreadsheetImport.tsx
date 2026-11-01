"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getValidSession } from "@/lib/supabaseAuth";
import { readApiJson } from "@/lib/clientApiResponse";
import { prepareProductImage } from "@/lib/productImages";
import { MAX_SPREADSHEET_BYTES, importCsv, matchImportImages, validateImportFields, type ImportCatalog, type ImportFields, type ImportReceipt } from "@/lib/productImport";
import { executeImportRow, runImportQueue, type ImportOutcome } from "@/lib/productImportWorkflow";
import { uploadImportPhoto } from "@/lib/productImportUpload";
import ProductImagePicker from "../product-images/ProductImagePicker";
import { useProductImages, type ProductImage } from "../product-images/useProductImages";
import styles from "./productImport.module.css";

type Row = {
  id: string; rowNumber: number; sheetRow: number; fields: ImportFields; sheetIssues: string[];
  photos?: ProductImage[]; coverId?: string; photoError?: string; stage?: string; outcome?: ImportOutcome;
};
type Masters = { catalog: ImportCatalog; vendors: Array<{ id: string; name: string }>; vendorId: string | null };

function download(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PhotoEditor({ row, save, close }: { row: Row; save: (images: ProductImage[], coverId?: string) => void; close: () => void }) {
  const controller = useProductImages(row.photos ?? [], row.coverId ?? null);
  return <section className={styles.photoEditor} aria-label={`Photos for spreadsheet row ${row.sheetRow}`}>
    <h2>Photos: {row.fields.title}</h2>
    <p>These photos match the spreadsheet filenames. To change the files, close this editor and select the matching photos again.</p>
    <ProductImagePicker controller={controller} allowSelection={false} />
    <div className={styles.buttons}>
      <button className={styles.secondary} disabled={controller.busy} onClick={close}>Cancel photo edits</button>
      <button className={styles.primary} disabled={controller.busy} onClick={() => save(controller.images, controller.coverId)}>Keep photo edits</button>
    </div>
  </section>;
}

export default function ProductSpreadsheetImport({ mode }: { mode: "vendor" | "admin" }) {
  const endpoint = `/api/${mode}/products/import`;
  const [masters, setMasters] = useState<Masters | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [catalogError, setCatalogError] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [batchId, setBatchId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [inputVersion, setInputVersion] = useState(0);
  const executing = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const session = await getValidSession();
        if (!session) throw new Error("Please sign in to import products.");
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const data = await readApiJson<Masters>(response, "Unable to load the import catalog.");
        if (active) { setMasters(data); setVendorId(data.vendorId ?? ""); setCatalogError(""); }
      } catch (error) { if (active) setCatalogError(error instanceof Error ? error.message : "Unable to load the catalog."); }
    }
    void load();
    return () => { active = false; };
  }, [endpoint, catalogAttempt]);

  const validated = useMemo(() => rows.map(row => {
    if (!masters) return { row, issues: ["Loading catalog…"], imageNames: [] as string[], matchedFiles: [] as File[] };
    const result = validateImportFields(row.fields, masters.catalog);
    const matched = matchImportImages(result.imageNames, files);
    return {
      row, imageNames: result.imageNames, matchedFiles: matched.files,
      issues: [...row.sheetIssues, ...result.issues.map(issue => `${issue.field}: ${issue.message}`), ...matched.issues.map(issue => issue.message), ...(row.photoError ? [row.photoError] : [])],
    };
  }), [rows, masters, files]);
  const validCount = validated.filter(item => !item.issues.length).length;
  const createdCount = rows.filter(row => row.outcome?.state === "created").length;
  const retryable = rows.filter(row => row.outcome && row.outcome.state !== "created");
  const locked = running || hasStarted || parsing || photoLoading;
  const unfinished = hasStarted && createdCount !== rows.length;

  useEffect(() => {
    if (!unfinished && !running) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const beforeNavigation = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (anchor && !anchor.hasAttribute("download") && !window.confirm("Some import results are unresolved. Keep this page open and retry them to avoid duplicate products. Leave this page?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeNavigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", beforeNavigation, true); };
  }, [unfinished, running]);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows(previous => previous.map(row => row.id === id ? { ...row, ...patch } : row));
  }

  async function parse(file: File) {
    setParsing(true); setError(""); setConfirming(false); setEditingId(null);
    try {
      if (file.size > MAX_SPREADSHEET_BYTES) throw new Error("The spreadsheet must be 10 MB or smaller.");
      const { parseProductSpreadsheet } = await import("@/lib/productImportSpreadsheet");
      const parsed = parseProductSpreadsheet(await file.arrayBuffer(), file.name);
      setRows(parsed.map((row, index) => ({ id: crypto.randomUUID(), rowNumber: index + 1, sheetRow: row.sheetRow, fields: row.fields, sheetIssues: row.issues })));
      setSheetName(file.name); setBatchId(crypto.randomUUID());
    } catch (error) { setRows([]); setSheetName(""); setError(error instanceof Error ? error.message : "Unable to read the spreadsheet."); }
    finally { setParsing(false); }
  }

  async function template(format: "csv" | "xlsx") {
    if (!masters) return;
    setError("");
    try {
      const { productImportWorkbook } = await import("@/lib/productImportSpreadsheet");
      const workbook = productImportWorkbook(masters.catalog);
      download(format === "csv" ? importCsv(workbook.examples) : workbook.data, `product-import-template.${format}`, format === "csv" ? "text/csv;charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } catch { setError("Unable to generate the template. Please retry."); }
  }

  async function preparePhotos(row: Row, matchedFiles: File[]) {
    if (row.photos) return row.photos;
    const photos: ProductImage[] = [];
    for (const source of matchedFiles) {
      const prepared = await prepareProductImage(source);
      if (!prepared) throw new Error(`Photo ${source.name} could not be decoded. Re-select a valid image before importing.`);
      photos.push({ id: crypto.randomUUID(), source, file: prepared.file });
    }
    updateRow(row.id, { photos, photoError: undefined });
    return photos;
  }

  async function editPhotos(id: string) {
    const item = validated.find(item => item.row.id === id);
    if (!item || item.issues.length || locked || editingId) return;
    setPhotoLoading(true); setError("");
    try { await preparePhotos(item.row, item.matchedFiles); setEditingId(id); }
    catch (error) { updateRow(id, { photoError: error instanceof Error ? error.message : "Unable to prepare photos." }); }
    finally { setPhotoLoading(false); }
  }

  async function reviewImport() {
    if (locked || editingId || !vendorId || validCount !== rows.length) return;
    setPhotoLoading(true); setError("");
    let invalid = false;
    try {
      await runImportQueue(validated, async item => {
        try { await preparePhotos(item.row, item.matchedFiles); }
        catch (error) { invalid = true; updateRow(item.row.id, { photoError: error instanceof Error ? error.message : "Unable to prepare photos." }); }
      });
      if (!invalid) setConfirming(true);
      else setError("Some photos could not be decoded. Re-select valid photos or remove the affected rows before importing.");
    } finally { setPhotoLoading(false); }
  }

  async function request<T>(body: Record<string, unknown>): Promise<T> {
    const session = await getValidSession();
    if (!session) throw new Error("Your session expired. Sign in again, then retry this row.");
    const response = await fetch(endpoint, {
      method: "POST", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, ...body }), signal: AbortSignal.timeout(30000),
    });
    return readApiJson<T>(response, "The import response could not be confirmed.");
  }

  async function run(retry = false) {
    if (executing.current || !vendorId || editingId || photoLoading || parsing) return;
    const selected = validated.filter(item => retry ? item.row.outcome && item.row.outcome.state !== "created" : !item.issues.length && !item.row.outcome);
    if (!selected.length || (!retry && selected.length !== rows.length)) return;
    executing.current = true;
    setRunning(true); setHasStarted(true); setConfirming(false); setError("");
    try {
      await runImportQueue(selected, async item => {
        let orderedPhotos: ProductImage[] = [];
        const outcome = await executeImportRow({
          stage: stage => updateRow(item.row.id, { stage }),
          check: () => request({ action: "status", rowId: item.row.id }),
          prepare: async () => {
            const photos = await preparePhotos(item.row, item.matchedFiles);
            const cover = photos.find(photo => photo.id === item.row.coverId) ?? photos[0];
            orderedPhotos = cover ? [cover, ...photos.filter(photo => photo.id !== cover.id)] : [];
            const images = [];
            for (const photo of orderedPhotos) {
              if (!photo.file || typeof photo.source === "string") throw new Error("Re-select this row's source photos.");
              const hash = await crypto.subtle.digest("SHA-256", await photo.file.arrayBuffer());
              images.push({ name: photo.source.name, type: photo.file.type, size: photo.file.size, sha256: Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("") });
            }
            const receipt = await request<ImportReceipt>({ action: "prepare", rowId: item.row.id, rowNumber: item.row.rowNumber, vendorId, fields: item.row.fields, images });
            if (receipt.state !== "created" && receipt.images.length !== orderedPhotos.length) throw new Error("Prepared photo count does not match this row.");
            return receipt;
          },
          upload: async (index, path) => {
            const session = await getValidSession();
            if (!session) throw new Error("Your session expired. Sign in again and retry this row.");
            const file = orderedPhotos[index]?.file;
            if (!file) throw new Error("Missing prepared photo.");
            await uploadImportPhoto(file, path, session.accessToken);
          },
          commit: attemptId => request({ action: "commit", rowId: item.row.id, attemptId }),
          abort: attemptId => request({ action: "abort", rowId: item.row.id, attemptId }),
        }, item.row.outcome?.state === "uncertain");
        updateRow(item.row.id, { outcome, stage: undefined });
      });
    } finally { executing.current = false; setRunning(false); }
  }

  function newBatch() {
    if (running || (unfinished && !window.confirm("Unconfirmed rows may already be saved. Retry them before starting another batch. Start a new batch anyway?"))) return;
    setRows([]); setFiles([]); setSheetName(""); setHasStarted(false); setConfirming(false); setEditingId(null); setBatchId(crypto.randomUUID()); setInputVersion(value => value + 1); setError("");
  }

  function exportErrors() {
    const failed = validated.filter(item => item.row.outcome?.state === "failed" || (!item.row.outcome && item.issues.length));
    const messages = failed.map(item => `Sheet row ${item.row.sheetRow}: ${item.row.outcome?.state === "failed" ? item.row.outcome.message : item.issues.join(" ")}`);
    download(importCsv(failed.map(item => item.row.fields), messages), "product-import-failed-rows.csv", "text/csv;charset=utf-8");
  }

  const editing = rows.find(row => row.id === editingId);
  const failedCount = validated.filter(item => item.row.outcome?.state === "failed" || (!item.row.outcome && item.issues.length)).length;
  const uncertainCount = rows.filter(row => row.outcome?.state === "uncertain").length;

  return <div className={styles.page}>
    <header className={styles.hero}>
      <Link href={`/${mode}/products`}>← Back to products</Link>
      <h1>Bulk product upload</h1>
      <p>Create up to 100 products from one CSV/XLSX sheet. Match local photos, review every row, then confirm.</p>
    </header>
    {catalogError && <div className={styles.error} role="alert">{catalogError} <button onClick={() => setCatalogAttempt(value => value + 1)}>Retry catalog</button> <Link href={`/login?next=/${mode}/products/import`}>Sign in</Link></div>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <section className={styles.card} aria-label="Import setup">
      <h2>1. Prepare your spreadsheet</h2>
      <p>Use the template and its catalog reference. Replace the sample rows. Only the first worksheet is imported.</p>
      <div className={styles.buttons}>
        <button className={styles.secondary} disabled={!masters || running} onClick={() => void template("xlsx")}>Download XLSX template & catalog</button>
        <button className={styles.secondary} disabled={!masters || running} onClick={() => void template("csv")}>Download CSV template</button>
      </div>
      <details><summary>Columns and import rules</summary>
        <ul>
          <li>Required: title, listing_type, category_slug, price_type. Fixed Price and Starts From also need a price.</li>
          <li>Use category slugs and subcategory/tag names from the catalog. Separate list values with semicolons.</li>
          <li>Up to five optional photos: put exact filenames in image_1 through image_5. The first is the cover.</li>
          <li>Plain values only. No formulas, updates to existing products, URLs, approval fields or specification columns.</li>
          <li>Spreadsheet limit: 10 MB, 100 products. Each batch belongs to one vendor.</li>
        </ul>
        {masters && <div className={styles.reference}><table><thead><tr><th>Category</th><th>Slug</th><th>Subcategories</th></tr></thead><tbody>{masters.catalog.categories.map(category => <tr key={category.id}><td>{category.name}</td><td>{category.slug}</td><td>{masters.catalog.subcategories.filter(sub => sub.categoryId === category.id).map(sub => sub.name).join("; ") || "—"}</td></tr>)}</tbody></table><p>Available tags: {masters.catalog.tags.map(tag => tag.name).join("; ") || "None"}</p></div>}
      </details>
      {mode === "admin" && <label className={styles.field}>Vendor for this entire batch
        <select value={vendorId} disabled={locked || Boolean(editingId)} onChange={event => { setVendorId(event.target.value); setConfirming(false); }}>
          <option value="">Select a vendor</option>{masters?.vendors.map(vendor => <option value={vendor.id} key={vendor.id}>{vendor.name}</option>)}
        </select>
      </label>}
      <div className={styles.inputs} key={inputVersion}>
        <label className={styles.field}>Spreadsheet (.csv or .xlsx, up to 10 MB)
          <input type="file" accept=".csv,.xlsx" disabled={!masters || locked || Boolean(editingId)} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void parse(file); }} />
        </label>
        <label className={styles.field}>Matching local photos (select all referenced files together)
          <input type="file" accept="image/*" multiple disabled={!masters || locked || Boolean(editingId)} onChange={event => {
            const selected = Array.from(event.target.files ?? []);
            if (selected.length > 500 || selected.reduce((total, file) => total + file.size, 0) > 200 * 1024 * 1024) {
              setError("Select at most 500 photo files totaling 200 MB. Split larger uploads into smaller batches."); event.target.value = ""; setFiles([]); return;
            }
            setFiles(selected); setConfirming(false); setError("");
            setRows(previous => previous.map(row => ({ ...row, photos: undefined, coverId: undefined, photoError: undefined })));
          }} />
        </label>
      </div>
      <p className={styles.muted}>{parsing ? "Reading spreadsheet…" : sheetName || "No spreadsheet selected."} {files.length ? `${files.length} photo file(s) selected.` : ""}</p>
    </section>
    {rows.length > 0 && <section className={styles.card} aria-label="Import preview">
      <div className={styles.sectionHeader}><div><h2>2. Review products</h2><p>{rows.length} rows · {hasStarted ? `${createdCount} created · ${retryable.length} need attention` : `${validCount} ready · ${rows.length - validCount} invalid`}</p></div>
        <div className={styles.buttons}>
          {!hasStarted && validCount < rows.length && <button className={styles.secondary} disabled={locked || Boolean(editingId)} onClick={() => { const ids = new Set(validated.filter(item => !item.issues.length).map(item => item.row.id)); setRows(previous => previous.filter(row => ids.has(row.id))); setConfirming(false); }}>Remove invalid rows</button>}
          {failedCount > 0 && <button className={styles.secondary} disabled={running} onClick={exportErrors}>Download failed rows ({failedCount})</button>}
        </div>
      </div>
      <div className={styles.tableWrap}><table>
        <thead><tr><th>Sheet row</th><th>Product</th><th>Price</th><th>Photos</th><th>Status / validation</th><th>Actions</th></tr></thead>
        <tbody>{validated.map(({ row, issues, imageNames }) => <tr key={row.id}>
          <td>{row.sheetRow}</td><td><strong>{row.fields.title || "Untitled"}</strong><small>{row.fields.listing_type} · {row.fields.category_slug}</small></td>
          <td>{row.fields.price_type === "Price on Request" ? "On request" : `${row.fields.currency || "INR"} ${row.fields.price ?? ""}`}</td>
          <td>{imageNames.length ? <><span>{imageNames.length} photo reference(s)</span><small>{imageNames.join(", ")}</small><button className={styles.textButton} disabled={locked || Boolean(editingId) || issues.length > 0} onClick={() => void editPhotos(row.id)}>Preview / crop photos</button></> : "No photos"}</td>
          <td aria-live="polite">{row.stage ? <span className={styles.pending}>{row.stage}</span> : row.outcome?.state === "created" ? <span className={styles.success}>Created</span> : row.outcome ? <><strong className={styles.error}>{row.outcome.state === "uncertain" ? "Save unconfirmed" : "Failed"}</strong><small>{row.outcome.message}</small></> : issues.length ? <ul className={styles.error}>{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul> : <span className={styles.success}>Ready</span>}</td>
          <td>{row.outcome?.state === "created" ? <Link href={`/${mode}/products/${row.outcome.productId}`}>View product</Link> : !hasStarted ? <button className={styles.textButton} disabled={locked || Boolean(editingId)} onClick={() => { setRows(previous => previous.filter(item => item.id !== row.id)); setConfirming(false); }}>Remove row {row.sheetRow}</button> : "—"}</td>
        </tr>)}</tbody>
      </table></div>
      {photoLoading && <p role="status">Preparing photo preview…</p>}
      {editing && <PhotoEditor key={editing.id} row={editing} close={() => setEditingId(null)} save={(photos, coverId) => { updateRow(editing.id, { photos, coverId }); setEditingId(null); }} />}
      {running && <div className={styles.progress} role="status"><progress value={rows.filter(row => row.outcome).length} max={rows.length} /> {createdCount} products created. Keep this page open.</div>}
      {uncertainCount > 0 && <p className={styles.warning}>{uncertainCount} save result(s) are unconfirmed. Retry on this page before creating another batch. Unconfirmed rows are excluded from failed-row exports.</p>}
      <p className={styles.warning}>New listings only. {mode === "vendor" ? "Products will be pending admin review." : "Products will be approved and may become publicly visible immediately."} Keep this page open until all results are resolved. Reloading starts a new batch.</p>
      <div className={styles.buttons}>
        {!hasStarted && <button className={styles.primary} disabled={locked || Boolean(editingId) || !vendorId || validCount !== rows.length || !rows.length} onClick={() => void reviewImport()}>Review import ({validCount})</button>}
        {hasStarted && retryable.length > 0 && <button className={styles.primary} disabled={running} onClick={() => void run(true)}>Retry failed / unconfirmed rows ({retryable.length})</button>}
        {hasStarted && <button className={styles.secondary} disabled={running} onClick={newBatch}>Start new batch</button>}
      </div>
      {confirming && <div className={styles.confirmation} role="group" aria-label="Confirm product import">
        <h3>Confirm {rows.length} new product(s)</h3>
        <p>{mode === "admin" ? `Vendor: ${masters?.vendors.find(vendor => vendor.id === vendorId)?.name}. Products will be approved.` : "These products will be submitted for admin review."} Photos will upload now. Existing products will not be updated.</p>
        <div className={styles.buttons}><button className={styles.secondary} onClick={() => setConfirming(false)}>Cancel import</button><button className={styles.primary} onClick={() => void run()}>Confirm import ({rows.length})</button></div>
      </div>}
    </section>}
  </div>;
}
