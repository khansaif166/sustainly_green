"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ExternalLink, Search, Trash2, Upload, Download, FileSpreadsheet, Plus, Building2, MapPin, ShieldCheck, ArrowRight, LoaderCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { getStoredSession } from "@/lib/supabaseAuth";
import { getVendorBadgeMeta, VENDOR_BADGES, type VendorBadgeType } from "@/lib/vendorBadges";
import {
  MAX_IMPORT_ROWS,
  OPTIONAL_COLUMNS,
  parseVendorSheet,
  REQUIRED_COLUMNS,
  TEMPLATE_COLUMNS,
  TEMPLATE_EXAMPLE_ROW,
} from "@/lib/vendorImport";

type VendorStatusFilter = "ALL" | "APPROVED" | "PENDING";
type VendorAction = "approve" | "suspend" | "reject" | "verify" | "removeBadge" | "delete";

const VENDOR_ACTION_MESSAGES: Record<VendorAction, { pending: string; success: string }> = {
  approve: { pending: "Approving…", success: "Vendor approved" },
  suspend: { pending: "Suspending…", success: "Vendor suspended" },
  reject: { pending: "Rejecting…", success: "Vendor rejected" },
  verify: { pending: "Verifying…", success: "Verified Supplier badge added" },
  removeBadge: { pending: "Removing…", success: "Verification badge removed" },
  delete: { pending: "Deleting…", success: "Vendor deleted" },
};

const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

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
  const [pendingActions, setPendingActions] = useState<Partial<Record<string, VendorAction>>>({});
  const [cardErrors, setCardErrors] = useState<Partial<Record<string, string>>>({});
  const inFlightVendorIds = useRef(new Set<string>());
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
    void fetchVendors();
  }, []);

  async function runVendorAction(vendor: Vendor, action: VendorAction) {
    const uid = vendor.uid;
    if (inFlightVendorIds.current.has(uid)) return;
    if (action === "delete" && !window.confirm(
      `Permanently delete ${vendor.companyName}?\n\n` +
      "This deletes the vendor account, profile, products, product images, logo, certificates, awards, and related records. " +
      "This cannot be undone.",
    )) return;

    const session = getStoredSession();
    if (!session) {
      const message = "Your session has expired. Please sign in again.";
      setCardErrors(previous => ({ ...previous, [uid]: message }));
      toast.error(message);
      return;
    }

    inFlightVendorIds.current.add(uid);
    setPendingActions(previous => ({ ...previous, [uid]: action }));
    setCardErrors(previous => ({ ...previous, [uid]: undefined }));
    const updatesBadge = action === "verify" || action === "removeBadge";
    const listingBadgeType: VendorBadgeType | "" = action === "verify" ? "verified_supplier" : "";
    const patch = updatesBadge ? { listingBadgeType } : { approved: action === "approve" };
    try {
      const res = await fetch(`/api/admin/vendors/${uid}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        ...(action !== "delete" ? { body: JSON.stringify(patch) } : {}),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message || "Unable to complete this action. Please try again.");
      }
      setVendors(previous => action === "delete"
        ? previous.filter(item => item.uid !== uid)
        : previous.map(item => {
          if (item.uid !== uid) return item;
          if (!updatesBadge) return { ...item, approved: action === "approve" };
          const publicContact = { ...item.publicContact };
          if (listingBadgeType) publicContact.sustainlyBadgeType = listingBadgeType;
          else delete publicContact.sustainlyBadgeType;
          return { ...item, listingVerified: Boolean(listingBadgeType), listingBadgeType, publicContact };
        }),
      );
      toast.success(VENDOR_ACTION_MESSAGES[action].success, { description: vendor.companyName });
    } catch (error) {
      const message = error instanceof TypeError
        ? "Unable to reach the server. Please try again."
        : error instanceof Error ? error.message : "Unable to complete this action. Please try again.";
      setCardErrors(previous => ({ ...previous, [uid]: message }));
      toast.error("Action failed", { description: message });
    } finally {
      inFlightVendorIds.current.delete(uid);
      setPendingActions(previous => {
        const next = { ...previous };
        delete next[uid];
        return next;
      });
    }
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, TEMPLATE_EXAMPLE_ROW]);
    sheet["!cols"] = TEMPLATE_COLUMNS.map((_, i) => ({ wch: Math.min(48, Math.max(18, String(TEMPLATE_EXAMPLE_ROW[i] ?? "").length + 4)) }));
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
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(bytes, { type: "array", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        setFileValidation({ status: "invalid", message: "The workbook does not contain a worksheet." });
        return;
      }
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false, blankrows: true });
      // Same rules as the server import (lib/vendorImport.ts).
      const result = parseVendorSheet(rows);
      if (!result.ok) {
        setFileValidation({ status: "invalid", message: result.columnError });
        return;
      }
      const populatedRows = result.rows;
      if (!populatedRows.length) {
        setFileValidation({ status: "invalid", message: "The worksheet has no vendor data." });
        return;
      }
      if (populatedRows.length > MAX_IMPORT_ROWS) {
        setFileValidation({ status: "invalid", message: `Only ${MAX_IMPORT_ROWS} vendors can be imported at once.` });
        return;
      }

      const errors = result.rowErrors.map((error) => `Row ${error.row}: ${error.message}`);
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

        .av-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:18px}
        .av-card{background:#fff;border:1px solid #dfe7e2;border-radius:16px;overflow:hidden;box-shadow:0 2px 5px rgba(17,40,27,.025);display:flex;flex-direction:column;min-width:0;transition:border-color .15s,box-shadow .15s}
        .av-card:hover{border-color:#bed0c3;box-shadow:0 5px 16px rgba(17,40,27,.055)}
        .av-card-top{padding:20px;border-bottom:1px solid #edf1ee}
        .av-card-identity{display:flex;align-items:flex-start;gap:12px;min-width:0}
        .av-card-logo{width:48px;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid #e0ebe4;border-radius:12px;background:#f3f9f5;overflow:hidden;font-size:19px;font-weight:800;color:#15803d}
        .av-card-logo img{width:100%;height:100%;object-fit:contain;padding:5px;background:#fff}
        .av-card-company{min-width:0;flex:1}
        .av-card-company h3{font-size:15px;font-weight:800;line-height:1.5;letter-spacing:-.015em;color:#172b20;overflow-wrap:anywhere;margin:0 0 3px}
        .av-card-business{font-size:12px;line-height:1.6;color:#65766b;margin:0;overflow-wrap:anywhere}
        .av-card-location{display:flex;align-items:baseline;gap:5px;font-size:11.5px;line-height:1.5;color:#65766b;margin:5px 0 0;overflow-wrap:anywhere}
        .av-card-location svg{flex-shrink:0;align-self:center}
        .av-card-statuses{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}
        .av-card-status{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border:1px solid transparent;border-radius:6px;font-size:10.5px;font-weight:700;line-height:1.4;white-space:nowrap}
        .av-card-status svg{flex-shrink:0}
        .av-card-status-approved{color:#166534;background:#edf8f0;border-color:#d9eddf}
        .av-card-status-pending{color:#92400e;background:#fff9eb;border-color:#f3e4bf}
        .av-card-status-unclaimed{color:#9a3412;background:#fff7ed;border-color:#f6e3cc}
        .av-card-status-verified{color:#0f6650;background:#eef8f4;border-color:#d1e9df}
        .av-card-body{padding:18px 20px;flex:1;min-width:0}
        .av-card-details{display:grid;grid-template-columns:82px minmax(0,1fr);gap:11px 12px;margin:0;font-size:12px;line-height:1.6}
        .av-card-details dt{color:#6a796f}
        .av-card-details dd{color:#2f4336;font-weight:600;overflow-wrap:anywhere;margin:0}
        .av-card-links{display:flex;align-items:center;flex-wrap:wrap;gap:8px 12px;margin-top:14px}
        .av-cert-chip{padding:3px 8px;background:#f2f7f4;color:#375d45;font-size:11px;line-height:1.5;border-radius:5px;overflow-wrap:anywhere;min-width:0}
        .av-card-external{display:inline-flex;align-items:center;gap:5px;color:#166534;font-size:11.5px;font-weight:600;text-decoration:none}
        .av-card-external:hover{text-decoration:underline}
        .av-card-foot{padding:16px 20px;background:#fafcfb;border-top:1px solid #edf1ee;display:flex;flex-direction:column;gap:12px}
        .av-card-profile{display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;border:1px solid #15803d;border-radius:9px;padding:9px 12px;background:#15803d;color:#fff;text-decoration:none;font-size:12.5px;line-height:1.5;font-weight:700;transition:background .15s}
        .av-card-profile:hover{background:#166534;border-color:#166534}
        .av-card-admin{display:flex;align-items:flex-end;justify-content:space-between;gap:8px}
        .av-card-tools{display:flex;gap:6px;flex-wrap:wrap;min-width:0}
        .av-card-tool{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:34px;padding:7px 9px;border:1px solid #e0e8e3;border-radius:7px;background:#fff;color:#53665a;font:inherit;font-size:11px;font-weight:600;line-height:1.4;cursor:pointer;transition:background .15s,border-color .15s}
        .av-card-tool svg{flex-shrink:0}
        .av-card-tool:hover{background:#f0f5f2;border-color:#becfc4}
        .av-card-tool-positive{color:#166534;background:#eff8f2;border-color:#d5e8dc}
        .av-card-tool-positive:hover{background:#e3f2e8;border-color:#bedbc9}
        .av-card-delete{flex-shrink:0;width:34px;padding:7px;color:#b74a4a;background:transparent;border-color:transparent}
        .av-card-delete:hover{background:#fff0f0;border-color:#f3d4d4;color:#b91c1c}
        .av-card-tool:disabled{opacity:.6;cursor:not-allowed}
        .av-card-tool[aria-busy=true]{opacity:1}
        .av-card-delete[aria-busy=true]{width:auto;padding:7px 9px}
        .av-card-spinner{animation:av-action-spin .8s linear infinite}
        @keyframes av-action-spin{to{transform:rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){.av-card-spinner{animation:none}}
        .av-card-action-error{display:flex;align-items:flex-start;gap:7px;padding:9px 10px;border:1px solid #fecaca;border-radius:8px;background:#fff4f4;color:#991b1b;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
        .av-card-action-error svg{flex-shrink:0;margin-top:2px}
        .av-card-profile:focus-visible,.av-card-tool:focus-visible,.av-card-external:focus-visible{outline:2px solid #16a34a;outline-offset:2px}

        .av-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:7px 14px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none;text-decoration:none}
        .av-btn-outline{border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151}
        .av-btn-outline:hover{background:#f9fafb}
        .av-btn-green{background:#16a34a;color:#fff;box-shadow:0 2px 8px rgba(22,163,74,.25)}
        .av-btn-green:hover{background:#15803d}
        .av-btn:disabled{opacity:.55;cursor:not-allowed}

        .av-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:40px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
        .av-import{background:#fff;border:1px solid #dfe7e2;border-radius:18px;overflow:hidden;box-shadow:0 2px 6px rgba(17,40,27,.025)}
        .av-import-head{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:20px 24px}
        .av-import-intro{display:flex;align-items:center;gap:12px;min-width:0}
        .av-import-intro>div:last-child,.av-import-bulk-info>div:last-child{min-width:0}
        .av-import-icon{width:40px;height:40px;flex-shrink:0;border:1px solid #dfede3;border-radius:10px;background:#f0f8f3;color:#15803d;display:flex;align-items:center;justify-content:center}
        .av-import-icon-secondary{background:#f0f4f1;border-color:#e4ebe6;color:#60776a}
        .av-import-title,.av-import-bulk-title{font-size:14px;font-weight:700;line-height:1.45;letter-spacing:-.01em;color:#17251c;margin:0 0 3px}
        .av-import-description,.av-import-bulk-description{font-size:12.5px;font-weight:400;line-height:1.55;color:#64756b;margin:0}
        .av-import-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 15px;border:1px solid #dce5df;border-radius:10px;background:#fff;color:#34483c;font-family:inherit;font-size:12.5px;font-weight:600;line-height:1.4;text-decoration:none;cursor:pointer;transition:background .15s,border-color .15s;flex-shrink:0}
        .av-import-action svg{flex-shrink:0}
        .av-import-action:hover{background:#f1f6f3;border-color:#bccfc2}
        .av-import-action:focus-visible{outline:2px solid #16a34a;outline-offset:3px}
        .av-import-primary{background:#15803d;border-color:#15803d;color:#fff;padding-inline:18px}
        .av-import-primary:hover{background:#166534;border-color:#166534}
        .av-import-bulk{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;border-top:1px solid #e9efeb;background:#f8faf9;padding:20px 24px}
        .av-import-bulk-info{display:flex;align-items:center;gap:12px;flex:1 1 260px;min-width:0}
        .av-import-actions{display:flex;gap:8px;flex-wrap:wrap;max-width:100%}
        .av-import-upload{background:#edf7f0;border-color:#d0e6d7;color:#166534}
        .av-import-upload:hover,.av-import-upload[aria-expanded=true]{background:#e1f1e6;border-color:#b8d8c3}
        .av-file{border:1.5px dashed #86a88f;border-radius:14px;padding:16px;margin:18px 24px;background:#f8fcf9}
        .av-import>.av-message{margin:0 24px 18px}
        .av-file-input{display:none}
        .av-selected-file{display:flex;align-items:center;gap:10px;margin-top:12px;padding:11px 12px;border:1px solid #86d39d;border-radius:12px;background:#f0fdf4;color:#166534}
        .av-selected-file.invalid{border-color:#f2a7a7;background:#fef2f2;color:#991b1b}
        .av-selected-file.validating{border-color:#f4cc75;background:#fffbeb;color:#92400e}
        .av-selected-file-name{font-size:12.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .av-selected-file-size{font-size:11px;opacity:.72;margin-top:2px}
        .av-columns{font-size:11.5px;color:#53645a;margin:7px 0 0;line-height:1.6}
        .av-message{padding:10px 12px;border-radius:10px;font-size:12.5px;line-height:1.45}
        @media(max-width:640px){
          .av-import-head{align-items:stretch;flex-direction:column;gap:16px;padding:20px 16px}
          .av-import-bulk{align-items:stretch;flex-direction:column;gap:16px;padding:20px 16px}
          .av-import-bulk-info{flex-basis:auto}
          .av-import-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}
          .av-import-actions .av-import-action{padding:10px;min-width:0}
          .av-file{margin:16px}
          .av-import>.av-message{margin:0 16px 16px}
        }
      `}</style>

      <div className="av-page">
        <Toaster position="top-right" richColors closeButton duration={4000} />

        {/* Hero */}
        <div className="av-hero">
          <div className="av-hero-inner">
            <div>
              <h1 className="av-hero-title">Vendor Management</h1>
              <p className="av-hero-sub">Review registrations, add vendor profiles, and import listings</p>
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


        <section className="av-import" aria-labelledby="add-vendor-profiles-title">
          <div className="av-import-head">
            <div className="av-import-intro">
              <div className="av-import-icon"><Building2 size={20} aria-hidden="true" /></div>
              <div>
                <h2 id="add-vendor-profiles-title" className="av-import-title">Add vendor profiles</h2>
                <p className="av-import-description">Create a profile with company details and a logo.</p>
              </div>
            </div>
            <Link href="/admin/vendors/new" className="av-import-action av-import-primary"><Plus size={16} aria-hidden="true" />Add vendor</Link>
          </div>
          <div className="av-import-bulk">
            <div className="av-import-bulk-info">
              <div className="av-import-icon av-import-icon-secondary"><FileSpreadsheet size={20} aria-hidden="true" /></div>
              <div>
                <h3 className="av-import-bulk-title">Import from Excel</h3>
                <p className="av-import-bulk-description">Use the template to add up to {MAX_IMPORT_ROWS.toLocaleString("en-IN")} vendors at once.</p>
              </div>
            </div>
            <div className="av-import-actions">
              <button type="button" onClick={() => void downloadTemplate()} className="av-import-action"><Download size={16} aria-hidden="true" /><span>Download template</span></button>
              <button type="button" onClick={() => { setImportOpen((value) => !value); setImportMessage(null); }} aria-expanded={importOpen} aria-controls="vendor-excel-import" className="av-import-action av-import-upload"><Upload size={16} aria-hidden="true" /><span>Upload Excel</span></button>
            </div>
          </div>
          {importOpen && (
            <div id="vendor-excel-import" className="av-file">
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
              <p className="av-columns">Upload an .xlsx file using the template. Logo is optional; Excel logos must be image URLs.</p>
              <p className="av-columns"><b>Required columns, in any order:</b> {REQUIRED_COLUMNS.join(" • ")}</p>
              <p className="av-columns"><b>Optional columns:</b> {OPTIONAL_COLUMNS.map((column) => column.label).join(" • ")}</p>
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
        </section>

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
              const pendingAction = pendingActions[v.uid];
              const busy = Boolean(pendingAction);
              const rejectionAction = v.approved ? "suspend" : "reject";
              return (
                <article key={v.uid} className="av-card" aria-labelledby={`vendor-company-${v.uid}`} aria-busy={busy}>
                  {/* Top */}
                  <div className="av-card-top">
                    <div className="av-card-identity">
                      <div className="av-card-logo">
                        {v.logoUrl ? <img src={v.logoUrl} alt={`${v.companyName} logo`} /> : <span aria-hidden="true">{initial}</span>}
                      </div>
                      <div className="av-card-company">
                        <h3 id={`vendor-company-${v.uid}`}>{v.companyName}</h3>
                        {v.businessType && <p className="av-card-business">{v.businessType}</p>}
                        <p className="av-card-location"><MapPin size={12} aria-hidden="true" /><span>{[v.city, v.country].filter(Boolean).join(", ") || "Location not provided"}</span></p>
                      </div>
                    </div>
                    <div className="av-card-statuses">
                      <span className={`av-card-status ${v.approved ? "av-card-status-approved" : "av-card-status-pending"}`}>
                        {v.approved ? <CheckCircle2 size={12} aria-hidden="true" /> : <span aria-hidden="true">•</span>}
                        {v.approved ? "Approved" : "Pending"}
                      </span>
                      {v.claimedStatus === "UNCLAIMED" && <span className="av-card-status av-card-status-unclaimed">Unclaimed</span>}
                      {badgeMeta && <span className="av-card-status av-card-status-verified"><ShieldCheck size={12} aria-hidden="true" />{badgeMeta.label}</span>}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="av-card-body">
                    <dl className="av-card-details">
                      <dt>Category</dt><dd>{v.primaryCategory || "—"}</dd>
                      <dt>Established</dt><dd>{v.yearOfIncorporation || "—"}</dd>
                      <dt>GST number</dt><dd>{v.gstNumber || "—"}</dd>
                      <dt>Contact</dt><dd>{v.whatsapp || "—"}</dd>
                    </dl>
                    {(v.primarySustainabilityCert || v.website) && (
                      <div className="av-card-links">
                        {v.primarySustainabilityCert && <span className="av-cert-chip">{v.primarySustainabilityCert}</span>}
                        {v.primarySustainabilityCert && v.certificateFileUrl && <a href={v.certificateFileUrl} target="_blank" rel="noopener noreferrer" className="av-card-external">View certificate<ExternalLink size={12} aria-hidden="true" /></a>}
                        {v.website && <a href={v.website} target="_blank" rel="noopener noreferrer" className="av-card-external">Website<ExternalLink size={12} aria-hidden="true" /></a>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="av-card-foot">
                    <Link href={`/admin/vendors/${v.uid}`} className="av-card-profile">View profile<ArrowRight size={15} aria-hidden="true" /></Link>
                    <div className="av-card-admin">
                      <div className="av-card-tools">
                        {!v.approved && (
                          <button type="button" onClick={() => void runVendorAction(v, "approve")} className="av-card-tool av-card-tool-positive" disabled={busy} aria-busy={pendingAction === "approve"}>
                            {pendingAction === "approve" ? <LoaderCircle size={13} className="av-card-spinner" aria-hidden="true" /> : <CheckCircle2 size={13} aria-hidden="true" />}
                            {pendingAction === "approve" ? VENDOR_ACTION_MESSAGES.approve.pending : "Approve"}
                          </button>
                        )}
                        <button type="button" onClick={() => void runVendorAction(v, rejectionAction)} className="av-card-tool" disabled={busy} aria-busy={pendingAction === rejectionAction}>
                          {pendingAction === rejectionAction ? <LoaderCircle size={13} className="av-card-spinner" aria-hidden="true" /> : <XCircle size={13} aria-hidden="true" />}
                          {pendingAction === rejectionAction ? VENDOR_ACTION_MESSAGES[rejectionAction].pending : v.approved ? "Suspend" : "Reject"}
                        </button>
                        {badgeMeta ? (
                          <button type="button" onClick={() => void runVendorAction(v, "removeBadge")} className="av-card-tool" disabled={busy} aria-busy={pendingAction === "removeBadge"}>
                            {pendingAction === "removeBadge" && <LoaderCircle size={13} className="av-card-spinner" aria-hidden="true" />}
                            {pendingAction === "removeBadge" ? VENDOR_ACTION_MESSAGES.removeBadge.pending : "Remove badge"}
                          </button>
                        ) : (
                          <button type="button" onClick={() => void runVendorAction(v, "verify")} className="av-card-tool av-card-tool-positive" title={`Assign ${VENDOR_BADGES.verified_supplier.label} badge`} disabled={busy} aria-busy={pendingAction === "verify"}>
                            {pendingAction === "verify" ? <LoaderCircle size={13} className="av-card-spinner" aria-hidden="true" /> : <ShieldCheck size={13} aria-hidden="true" />}
                            {pendingAction === "verify" ? VENDOR_ACTION_MESSAGES.verify.pending : "Verify supplier"}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void runVendorAction(v, "delete")}
                        className="av-card-tool av-card-delete"
                        title={pendingAction === "delete" ? "Deleting vendor…" : "Delete vendor"}
                        aria-label={`${pendingAction === "delete" ? "Deleting" : "Delete"} ${v.companyName}`}
                        aria-busy={pendingAction === "delete"}
                        disabled={busy}
                      >
                        {pendingAction === "delete" ? <><LoaderCircle size={15} className="av-card-spinner" aria-hidden="true" />{VENDOR_ACTION_MESSAGES.delete.pending}</> : <Trash2 size={15} aria-hidden="true" />}
                      </button>
                    </div>
                    {cardErrors[v.uid] && <div className="av-card-action-error" role="alert"><XCircle size={13} aria-hidden="true" /><span>{cardErrors[v.uid]}</span></div>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
