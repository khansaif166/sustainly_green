"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Search, Trash2, Upload, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { getStoredSession } from "@/lib/supabaseAuth";
import { getVendorBadgeMeta, VENDOR_BADGES, type VendorBadgeType } from "@/lib/vendorBadges";

type VendorStatusFilter = "ALL" | "APPROVED" | "PENDING";

const IMPORT_COLUMNS = ["Logo", "Company Name", "Categories", "Products/ Services", "Address", "State", "Operating Hours", "Business Description"];
const MAX_IMPORT_SIZE = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 1000;

type FileValidation = {
  status: "validating" | "valid" | "invalid";
  message: string;
  rowCount?: number;
};

type Vendor = {
  website?: string;
  uid: string;
  companyName: string;
  registrationType?: string;
  cinRegistration?: string;
  gstNumber?: string;
  yearOfIncorporation?: string;
  businessType?: string;
  primaryCategory?: string;
  country: string;
  city: string;
  businessEmail?: string;
  whatsapp?: string;
  primaryContactName?: string;
  primarySustainabilityCert?: string;
  certificateFileUrl?: string;
  shortDescription?: string;
  logoUrl?: string;
  approved: boolean;
  listingVerified?: boolean;
  listingBadgeType?: string;
  publicContact?: Record<string, unknown>;
  claimedStatus?: string;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState<VendorStatusFilter>("ALL");
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [fileValidation, setFileValidation] = useState<FileValidation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchVendors() {
    const session = getStoredSession();
    if (!session) { setLoading(false); return; }
    const res = await fetch("/api/admin/vendors", { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const payload = await res.json();
    if (res.ok) setVendors(payload.vendors || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchVendors();
  }, []);

  async function approveVendor(uid: string) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ approved: true }) });
    fetchVendors();
  }

  async function rejectVendor(uid: string) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ approved: false }) });
    fetchVendors();
  }

  async function setVendorBadge(uid: string, listingBadgeType: VendorBadgeType | "") {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/vendors/${uid}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ listingBadgeType }),
    });
    fetchVendors();
  }

  async function deleteVendor(uid: string) {
    if (!confirm("Delete this vendor? This cannot be undone.")) return;
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/vendors/${uid}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    fetchVendors();
  }

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([
      IMPORT_COLUMNS,
      ["https://example.com/logo.png", "Example Green Company", "Renewable Energy, Solar", "Solar panels; Installation", "12 Example Road", "Karnataka", "Mon-Sat, 9:00 AM-6:00 PM", "Sustainable energy products and services."],
    ]);
    sheet["!cols"] = [{ wch: 34 }, { wch: 28 }, { wch: 30 }, { wch: 34 }, { wch: 38 }, { wch: 20 }, { wch: 30 }, { wch: 48 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Vendors");
    XLSX.writeFile(workbook, "vendor-import-template.xlsx");
  }

  async function validateSelectedFile(file: File) {
    setImportFile(file);
    setImportMessage(null);
    setFileValidation({ status: "validating", message: "Checking file, columns, and vendor data…" });

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setFileValidation({ status: "invalid", message: "Only .xlsx Excel files are accepted." });
      return;
    }
    if (!file.size || file.size > MAX_IMPORT_SIZE) {
      setFileValidation({ status: "invalid", message: "The file must be smaller than 5 MB." });
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        setFileValidation({ status: "invalid", message: "This is not a valid .xlsx Excel workbook." });
        return;
      }
      const workbook = XLSX.read(bytes, { type: "array", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        setFileValidation({ status: "invalid", message: "The workbook does not contain a worksheet." });
        return;
      }
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false, blankrows: true });
      const clean = (value: unknown) => value == null ? "" : String(value).trim().replace(/\s+/g, " ");
      const headers = (rows[0] || []).map(clean);
      const correctHeaders = headers.length === IMPORT_COLUMNS.length && IMPORT_COLUMNS.every((header) => headers.includes(header));
      if (!correctHeaders) {
        setFileValidation({ status: "invalid", message: `The file must contain only these columns, in any order: ${IMPORT_COLUMNS.join(", ")}.` });
        return;
      }
      const populatedRows = rows.slice(1)
        .map((row, index) => ({ row, excelRow: index + 2 }))
        .filter(({ row }) => row.some((value) => clean(value)));
      if (!populatedRows.length) {
        setFileValidation({ status: "invalid", message: "The worksheet has no vendor data." });
        return;
      }
      if (populatedRows.length > MAX_IMPORT_ROWS) {
        setFileValidation({ status: "invalid", message: `Only ${MAX_IMPORT_ROWS} vendors can be imported at once.` });
        return;
      }

      const errors: string[] = [];
      const seen = new Map<string, number>();
      for (const { row, excelRow } of populatedRows) {
        const values = IMPORT_COLUMNS.map((column) => clean(row[headers.indexOf(column)]));
        const missing = IMPORT_COLUMNS.filter((_, index) => !values[index]);
        if (missing.length) errors.push(`Row ${excelRow}: missing ${missing.join(", ")}.`);
        if (values[0] && !/^https?:\/\/\S+$/i.test(values[0])) errors.push(`Row ${excelRow}: Logo must be an http(s) URL.`);
        const key = [values[1], values[4], values[5]].map((value) => value.toLocaleLowerCase()).join("|");
        const firstRow = seen.get(key);
        if (firstRow) errors.push(`Row ${excelRow}: duplicate of row ${firstRow}.`);
        else seen.set(key, excelRow);
      }
      if (errors.length) {
        const remaining = errors.length > 5 ? ` Plus ${errors.length - 5} more error${errors.length - 5 === 1 ? "" : "s"}.` : "";
        setFileValidation({ status: "invalid", message: `${errors.slice(0, 5).join(" ")}${remaining}`, rowCount: populatedRows.length });
        return;
      }
      setFileValidation({ status: "valid", message: `All columns and data are valid. ${populatedRows.length} vendor${populatedRows.length === 1 ? "" : "s"} ready to import.`, rowCount: populatedRows.length });
    } catch {
      setFileValidation({ status: "invalid", message: "The Excel workbook could not be read. Download the template and try again." });
    }
  }

  async function importVendors() {
    if (!importFile) return;
    const session = getStoredSession();
    if (!session) return;
    setImporting(true);
    setImportMessage(null);
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const res = await fetch("/api/admin/vendors/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) {
        const rowErrors = payload.error?.details?.rowErrors as Array<{ row: number; message: string }> | undefined;
        const suffix = rowErrors?.length
          ? ` ${rowErrors.slice(0, 5).map((error) => `Row ${error.row}: ${error.message}`).join(" ")}`
          : "";
        setImportMessage({ kind: "error", text: `${payload.error?.message || "Import failed."}${suffix}` });
        return;
      }
      setImportMessage({
        kind: "success",
        text: `Imported ${payload.inserted} vendor${payload.inserted === 1 ? "" : "s"}.${payload.skippedDuplicates ? ` Skipped ${payload.skippedDuplicates} already in the database.` : ""}`,
      });
      setImportFile(null);
      setFileValidation(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchVendors();
    } catch {
      setImportMessage({ kind: "error", text: "The import request failed. Please try again." });
    } finally {
      setImporting(false);
    }
  }

  const filtered = useMemo(() => vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = v.companyName?.toLowerCase().includes(q) || v.businessEmail?.toLowerCase().includes(q);
    const matchStatus = status === "ALL" || (status === "APPROVED" && v.approved) || (status === "PENDING" && !v.approved);
    return matchSearch && matchStatus;
  }), [vendors, search, status]);

  const pending  = vendors.filter(v => !v.approved).length;
  const approved = vendors.filter(v => v.approved).length;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .av-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .av-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .av-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .av-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .av-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .av-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .av-hero-stats{display:flex;gap:20px}
        .av-hero-stat{text-align:right}
        .av-hero-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .av-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .av-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap}
        .av-search{position:relative;flex:1;min-width:180px}
        .av-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .av-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;transition:border .15s;background:#fff;box-sizing:border-box;color:#111}
        .av-search input:focus{border-color:#16a34a}
        .av-select{padding:9px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111;min-width:150px}
        .av-select:focus{border-color:#16a34a}

        .av-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .av-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column}
        .av-card-top{padding:16px;border-bottom:1px solid #f3f4f6}
        .av-card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:#6b7280}
        .av-card-foot{padding:12px 14px;border-top:1px solid #f3f4f6;display:flex;gap:8px;flex-wrap:wrap}
        .av-avatar{width:40px;height:40px;border-radius:13px;object-fit:cover;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#16a34a;flex-shrink:0}
        .av-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px}
        .av-cert-chip{display:inline-block;padding:3px 9px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:700;border-radius:50px;border:1px solid rgba(22,163,74,.15)}

        .av-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:7px 14px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none;text-decoration:none}
        .av-btn-outline{border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151}
        .av-btn-outline:hover{background:#f9fafb}
        .av-btn-green{background:#16a34a;color:#fff;box-shadow:0 2px 8px rgba(22,163,74,.25)}
        .av-btn-green:hover{background:#15803d}
        .av-btn-ghost{border:1.5px solid rgba(0,0,0,.08);background:#fff;color:#6b7280}
        .av-btn-ghost:hover{background:#f9fafb}
        .av-btn-danger{width:34px;height:34px;padding:0;border-radius:50%;background:#fef2f2;color:#dc2626;border:1.5px solid rgba(220,38,38,.15)}
        .av-btn-danger:hover{background:#fee2e2}

        .av-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:40px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
        .av-unclaimed{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:50px;font-size:10.5px;font-weight:700;background:#fff7ed;color:#c2410c;border:1px solid rgba(194,65,12,.15)}
        .av-verified-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:50px;font-size:10.5px;font-weight:800;background:#ecfdf5;color:#047857;border:1px solid rgba(4,120,87,.18)}
        .av-verified-badge img{width:18px;height:22px;object-fit:cover;border-radius:3px}
        .av-badge-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;flex:1 1 100%}
        .av-import{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:14px}
        .av-import-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .av-import-actions{display:flex;gap:9px;flex-wrap:wrap}
        .av-file{border:1.5px dashed #86a88f;border-radius:14px;padding:16px;background:#f8fcf9}
        .av-file-input{display:none}
        .av-selected-file{display:flex;align-items:center;gap:10px;margin-top:12px;padding:11px 12px;border:1px solid #86d39d;border-radius:12px;background:#f0fdf4;color:#166534}
        .av-selected-file.invalid{border-color:#f2a7a7;background:#fef2f2;color:#991b1b}
        .av-selected-file.validating{border-color:#f4cc75;background:#fffbeb;color:#92400e}
        .av-selected-file-name{font-size:12.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .av-selected-file-size{font-size:11px;opacity:.72;margin-top:2px}
        .av-columns{font-size:11.5px;color:#53645a;margin:7px 0 0;line-height:1.6}
        .av-message{padding:10px 12px;border-radius:10px;font-size:12.5px;line-height:1.45}
      `}</style>

      <div className="av-page">

        {/* Hero */}
        <div className="av-hero">
          <div className="av-hero-inner">
            <div>
              <h1 className="av-hero-title">Vendor Management</h1>
              <p className="av-hero-sub">Review registrations and import vendor listings</p>
            </div>
            <div className="av-hero-stats">
              <div className="av-hero-stat">
                <p className="av-hero-stat-val">{vendors.length}</p>
                <p className="av-hero-stat-label">Total</p>
              </div>
              <div className="av-hero-stat">
                <p className="av-hero-stat-val" style={{ color: "#fbbf24" }}>{pending}</p>
                <p className="av-hero-stat-label">Pending</p>
              </div>
              <div className="av-hero-stat">
                <p className="av-hero-stat-val">{approved}</p>
                <p className="av-hero-stat-label">Approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="av-import">
          <div className="av-import-head">
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "#f0fdf4", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}><FileSpreadsheet size={19} /></div>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 800, color: "#17251c" }}>Add vendors via Excel</p>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Only .xlsx files using the exact template columns are accepted. Logo values must be image URLs.</p>
              </div>
            </div>
            <div className="av-import-actions">
              <button type="button" onClick={downloadTemplate} className="av-btn av-btn-outline"><Download size={13} />Download template</button>
              <button type="button" onClick={() => { setImportOpen((value) => !value); setImportMessage(null); }} className="av-btn av-btn-green"><Upload size={13} />Upload Excel</button>
            </div>
          </div>
          {importOpen && (
            <div className="av-file">
              <input
                ref={fileInputRef}
                className="av-file-input"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void validateSelectedFile(file);
                }}
              />
              <p className="av-columns"><b>Required columns, in any order:</b> {IMPORT_COLUMNS.join(" • ")}</p>
              {importFile && (
                <div className={`av-selected-file ${fileValidation?.status || "validating"}`}>
                  <FileSpreadsheet size={21} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="av-selected-file-name">{importFile.name}</div>
                    <div className="av-selected-file-size">{(importFile.size / 1024).toFixed(1)} KB</div>
                    <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.45 }}>{fileValidation?.message}</div>
                  </div>
                  {fileValidation?.status === "valid" && <CheckCircle2 size={18} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                  {fileValidation?.status === "invalid" && <XCircle size={18} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }} className="av-btn av-btn-outline">
                  <FileSpreadsheet size={13} />{importFile ? "Change file" : "Choose Excel file"}
                </button>
                <button type="button" disabled={!importFile || fileValidation?.status !== "valid" || importing} onClick={importVendors} className="av-btn av-btn-green" style={{ opacity: !importFile || fileValidation?.status !== "valid" || importing ? .55 : 1 }}>
                  <Upload size={13} />{importing ? "Importing…" : "Import vendors"}
                </button>
                {!importFile && <span style={{ fontSize: 12, color: "#53645a" }}>No file chosen</span>}
              </div>
            </div>
          )}
          {importMessage && <div className="av-message" style={importMessage.kind === "success" ? { background: "#f0fdf4", color: "#166534" } : { background: "#fef2f2", color: "#991b1b" }}>{importMessage.text}</div>}
        </div>

        {/* Filter bar */}
        <div className="av-bar">
          <div className="av-search">
            <Search size={14} color="#9ca3af" className="av-search-icon" />
            <input placeholder="Search company or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="av-select" value={status} onChange={e => setStatus(e.target.value as VendorStatusFilter)}>
            <option value="ALL">All Vendors</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="av-empty">No vendors match your filters.</div>
        ) : (
          <div className="av-grid">
            {filtered.map(v => {
              const initial = v.companyName?.charAt(0)?.toUpperCase() || "?";
              const badgeMeta = getVendorBadgeMeta(v);
              return (
                <div key={v.uid} className="av-card">
                  {/* Top */}
                  <div className="av-card-top">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {v.logoUrl
                          ? <img src={v.logoUrl} alt={v.companyName} style={{ width: 40, height: 40, borderRadius: 13, objectFit: "cover", border: "1px solid rgba(0,0,0,.07)" }} />
                          : <div className="av-avatar">{initial}</div>
                        }
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 800, color: "#111", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{v.companyName}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0 }}>{v.businessType || "—"} • {v.city}</p>
                            {v.claimedStatus === "UNCLAIMED" && (
                              <span className="av-unclaimed">
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c2410c" }} />
                                Unclaimed
                              </span>
                            )}
                            {badgeMeta && (
                              <span className="av-verified-badge">
                                <img src={badgeMeta.src} alt="" />
                                {badgeMeta.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="av-badge" style={v.approved ? { background: "#f0fdf4", color: "#15803d" } : { background: "#fefce8", color: "#92400e" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.approved ? "#22c55e" : "#f59e0b", flexShrink: 0 }} />
                        {v.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="av-card-body">
                    <span><b style={{ color: "#374151" }}>Category:</b> {v.primaryCategory || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Est.:</b> {v.yearOfIncorporation || "—"}</span>
                    <span><b style={{ color: "#374151" }}>GST:</b> {v.gstNumber || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Contact:</b> {v.whatsapp || "—"}</span>
                    {v.primarySustainabilityCert && (
                      <div style={{ marginTop: 4 }}>
                        <span className="av-cert-chip">{v.primarySustainabilityCert}</span>
                        {v.certificateFileUrl && (
                          <a href={v.certificateFileUrl} target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#3b82f6", marginLeft: 6, textDecoration: "none" }}>
                            <ExternalLink size={10} />Doc
                          </a>
                        )}
                      </div>
                    )}
                    {v.website && (
                      <a href={v.website} target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#3b82f6", textDecoration: "none" }}>
                        <ExternalLink size={11} />Website
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="av-card-foot">
                    <a href={`/admin/vendors/${v.uid}`} className="av-btn av-btn-outline" style={{ flex: "1 1 100%", justifyContent: "center", marginBottom: 4 }}>
                      View Full Profile
                    </a>
                    {!v.approved && (
                      <button onClick={() => approveVendor(v.uid)} className="av-btn av-btn-green" style={{ flex: 1 }}>
                        <CheckCircle2 size={13} />Approve
                      </button>
                    )}
                    <button onClick={() => rejectVendor(v.uid)} className="av-btn av-btn-ghost" style={{ flex: 1 }}>
                      <XCircle size={13} />Reject
                    </button>
                    <div className="av-badge-actions">
                      <button onClick={() => setVendorBadge(v.uid, "verified_supplier")} className={getVendorBadgeMeta(v)?.type === "verified_supplier" ? "av-btn av-btn-green" : "av-btn av-btn-outline"}>
                        {VENDOR_BADGES.verified_supplier.label}
                      </button>
                      <button onClick={() => setVendorBadge(v.uid, "eco_verified")} className={getVendorBadgeMeta(v)?.type === "eco_verified" ? "av-btn av-btn-green" : "av-btn av-btn-outline"}>
                        {VENDOR_BADGES.eco_verified.label}
                      </button>
                      {v.listingVerified && (
                        <button onClick={() => setVendorBadge(v.uid, "")} className="av-btn av-btn-ghost" style={{ gridColumn: "1 / -1" }}>
                          Remove Badge
                        </button>
                      )}
                    </div>
                    <button onClick={() => deleteVendor(v.uid)} className="av-btn av-btn-danger" title="Delete vendor">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
