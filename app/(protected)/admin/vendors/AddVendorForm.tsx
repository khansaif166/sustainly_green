"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, ImagePlus, UploadCloud, Link2, ChevronDown, SlidersHorizontal, Globe2, CheckCircle2, AlertCircle, LoaderCircle, ArrowRight, Trash2 } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";
import {
  OPTIONAL_COLUMNS,
  VENDOR_REQUIRED_FIELDS,
  validateVendorFields,
  type VendorFieldErrors,
  type VendorFieldKey,
} from "@/lib/vendorImport";

const REQUIRED_FIELDS = VENDOR_REQUIRED_FIELDS.map((field) => ({ ...field, required: Boolean(field.required) }));
const OPTIONAL_FIELDS = OPTIONAL_COLUMNS.map((field) => ({ ...field, required: false }));
const MULTILINE = new Set<VendorFieldKey>(["address", "description", "sustainability", "productOfferings"]);
const LOCATION_KEYS = new Set<VendorFieldKey>(["address", "state", "operatingHours"]);
const COMPANY_FIELDS = REQUIRED_FIELDS.filter(field => field.key !== "logo" && !LOCATION_KEYS.has(field.key));
const LOCATION_FIELDS = REQUIRED_FIELDS.filter(field => LOCATION_KEYS.has(field.key));
const PLACEHOLDERS: Partial<Record<VendorFieldKey, string>> = {
  companyName: "e.g. GreenLoop Solutions",
  categories: "e.g. Sustainable packaging, Recycling",
  products: "e.g. Reusable containers; Packaging design",
  description: "Introduce the company, its products or services, and the customers it serves.",
  address: "Street address, area, and city",
  state: "e.g. Karnataka",
  operatingHours: "e.g. Mon–Sat, 9:00 AM–6:00 PM",
  industry: "e.g. Sustainable manufacturing",
  website: "https://example.com",
  brand: "e.g. GreenLoop",
  tagline: "A short introduction to the business",
  productOfferings: "Add more detail about the products or services offered.",
  linkedin: "https://linkedin.com/company/…",
  sustainability: "Describe the company's sustainability practices.",
  mapLink: "https://maps.google.com/…",
  rating: "e.g. 4.5",
};
const FIELD_HINTS: Partial<Record<VendorFieldKey, string>> = {
  categories: "Separate with commas or semicolons. The first is the primary category.",
  products: "Separate multiple products or services with commas or semicolons.",
  rating: "Enter a rating from 0 to 5.",
};
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

export default function AddVendorForm() {
  const router = useRouter();
  const [values, setValues] = useState<Partial<Record<VendorFieldKey, string>>>({});
  const [fieldErrors, setFieldErrors] = useState<VendorFieldErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFileError, setLogoFileError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [logoUrlOpen, setLogoUrlOpen] = useState(false);
  const [draggingLogo, setDraggingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadedLogoRef = useRef<{ file: File; url: string } | null>(null);
  const savingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!logoPreview) return;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  function chooseLogo(file: File) {
    setLogoFileError("");
    setFieldErrors((previous) => ({ ...previous, logo: undefined }));
    setLogoFile(null);
    setLogoPreview("");
    uploadedLogoRef.current = null;
    if (!LOGO_TYPES.includes(file.type)) {
      setLogoFileError("Choose a JPG, PNG, WebP, or GIF image.");
      if (logoInputRef.current) logoInputRef.current.value = "";
      return;
    }
    if (!file.size || file.size > MAX_LOGO_SIZE) {
      setLogoFileError("Choose an image between 1 byte and 5 MB.");
      if (logoInputRef.current) logoInputRef.current.value = "";
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) chooseLogo(file);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview("");
    setLogoFileError("");
    uploadedLogoRef.current = null;
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function showFieldErrors(errors: VendorFieldErrors) {
    setFieldErrors(errors);
    if (OPTIONAL_FIELDS.some(field => errors[field.key])) setAdditionalOpen(true);
    if (errors.logo) setLogoUrlOpen(true);
    requestAnimationFrame(() => {
      const fields = formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]");
      const first = Array.from(fields || []).find(field => errors[field.name as VendorFieldKey]);
      first?.focus();
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    setError("");
    if (logoFileError) {
      formRef.current?.querySelector<HTMLButtonElement>(".av-create-upload")?.focus();
      return;
    }
    const validation = validateVendorFields({ ...values, logo: logoFile ? "" : values.logo });
    showFieldErrors(validation.fieldErrors);
    if (Object.keys(validation.fieldErrors).length) return;

    const session = getStoredSession();
    if (!session) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      let logo = values.logo || "";
      if (logoFile) {
        if (uploadedLogoRef.current?.file === logoFile) {
          logo = uploadedLogoRef.current.url;
        } else {
          setUploadingLogo(true);
          const uploaded = await uploadFileToSupabaseStorage(logoFile, {
            bucket: "marketplace",
            folder: "vendors/logos",
            accessToken: session.accessToken,
            allowedTypes: LOGO_TYPES,
          });
          logo = uploaded.url;
          uploadedLogoRef.current = { file: logoFile, url: logo };
          setUploadingLogo(false);
        }
      }
      const response = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, logo }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.error?.details?.fieldErrors) showFieldErrors(payload.error.details.fieldErrors);
        throw new Error(payload.error?.message || "Unable to create vendor.");
      }
      router.push(`/admin/vendors/${payload.vendor.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create vendor. Please try again.");
      setUploadingLogo(false);
      savingRef.current = false;
      setSaving(false);
    }
  }

  function renderFields(fields: Array<{ key: VendorFieldKey; label: string; required: boolean }>) {
    return fields.map(({ key, label, required }) => {
      const props = {
        id: `add-vendor-${key}`,
        name: key,
        value: values[key] || "",
        required,
        disabled: saving,
        "aria-invalid": Boolean(fieldErrors[key]),
        "aria-describedby": [FIELD_HINTS[key] ? `add-vendor-${key}-hint` : "", fieldErrors[key] ? `add-vendor-${key}-error` : ""].filter(Boolean).join(" ") || undefined,
        onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setValues((previous) => ({ ...previous, [key]: event.target.value }));
          setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
        },
      };
      if (key === "logo") {
        return (
          <div key={key} className="av-create-logo-content">
            <input
              ref={logoInputRef}
              id="add-vendor-logo-file"
              name="logoFile"
              type="file"
              className="av-create-file-input"
              tabIndex={-1}
              aria-label="Company logo"
              accept={LOGO_TYPES.join(",")}
              onChange={selectLogo}
              disabled={saving}
              aria-invalid={Boolean(logoFileError)}
              aria-describedby={`add-vendor-logo-help${logoFileError ? " add-vendor-logo-file-error" : ""}`}
            />
            {logoFile && logoPreview ? (
              <div className="av-create-logo-selected">
                <div className="av-create-logo-image"><img src={logoPreview} alt="Selected company logo" /></div>
                <p className="av-create-logo-name">{logoFile.name}</p>
                <p className="av-create-help">{(logoFile.size / 1024).toFixed(1)} KB · Ready to upload</p>
                <div className="av-create-logo-controls">
                  <button type="button" className="av-create-logo-replace" onClick={() => logoInputRef.current?.click()} disabled={saving}><UploadCloud size={14} aria-hidden="true" />Replace</button>
                  <button type="button" className="av-create-logo-remove" onClick={removeLogo} disabled={saving}><Trash2 size={14} aria-hidden="true" />Remove</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={`av-create-upload${draggingLogo ? " av-create-upload-active" : ""}`}
                onClick={() => logoInputRef.current?.click()}
                disabled={saving}
                aria-describedby={`add-vendor-logo-help${logoFileError ? " add-vendor-logo-file-error" : ""}`}
                onDragOver={event => { event.preventDefault(); if (!saving) setDraggingLogo(true); }}
                onDragLeave={() => setDraggingLogo(false)}
                onDrop={event => {
                  event.preventDefault();
                  setDraggingLogo(false);
                  if (saving) return;
                  const file = event.dataTransfer.files[0];
                  if (file) chooseLogo(file);
                }}
              >
                <span className="av-create-upload-icon"><UploadCloud size={23} aria-hidden="true" /></span>
                <span className="av-create-upload-title">Click to upload a logo</span>
                <span className="av-create-upload-caption">or drag and drop an image here</span>
              </button>
            )}
            <p id="add-vendor-logo-help" className="av-create-logo-help">JPG, PNG, WebP or GIF · Up to 5 MB</p>
            {logoFileError && <p id="add-vendor-logo-file-error" className="av-create-field-error" role="alert">{logoFileError}</p>}
            {logoFileError && !logoFile && <button type="button" className="av-create-logo-remove" onClick={removeLogo} disabled={saving}>Clear selection</button>}
            {!logoFile && (
              <div className="av-create-logo-url">
                <button type="button" className="av-create-url-toggle" onClick={() => setLogoUrlOpen(open => !open)} aria-expanded={logoUrlOpen} aria-controls="add-vendor-logo-url" disabled={saving}><Link2 size={14} aria-hidden="true" />Use an image URL instead<ChevronDown size={14} aria-hidden="true" /></button>
                {logoUrlOpen && <div id="add-vendor-logo-url"><label htmlFor={props.id}>Logo URL</label><input {...props} type="text" placeholder="https://example.com/logo.png" />{fieldErrors.logo && <p id="add-vendor-logo-error" className="av-create-field-error">{fieldErrors.logo}</p>}</div>}
              </div>
            )}
          </div>
        );
      }
      return (
        <div key={key} className={MULTILINE.has(key) || key === "companyName" ? "av-create-wide" : undefined}>
          <label htmlFor={props.id}>{label}{required && <span className="av-create-required" aria-hidden="true"> *</span>}</label>
          {MULTILINE.has(key) ? <textarea {...props} rows={key === "description" ? 4 : 3} placeholder={PLACEHOLDERS[key]} /> : (
            <input {...props} type="text" inputMode={key === "rating" ? "decimal" : ["website", "linkedin", "mapLink"].includes(key) ? "url" : undefined} placeholder={PLACEHOLDERS[key]} />
          )}
          {FIELD_HINTS[key] && <p id={`add-vendor-${key}-hint`} className="av-create-help">{FIELD_HINTS[key]}</p>}
          {fieldErrors[key] && <p id={`add-vendor-${key}-error`} className="av-create-field-error">{fieldErrors[key]}</p>}
        </div>
      );
    });
  }

  return (
    <form ref={formRef} id="add-vendor-form" className="av-create" onSubmit={submit} noValidate aria-labelledby="add-vendor-title">
      <style>{`
        .av-create{min-width:0;color:#193329}
        .av-create-intro{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0 18px;font-size:13px;line-height:1.6;color:#53645a}
        .av-create-intro p{margin:0}.av-create-intro>span{flex-shrink:0;font-size:12px}
        .av-create-required{color:#b42318}
        .av-create-layout{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:22px;align-items:start}
        .av-create-main,.av-create-sidebar{display:flex;flex-direction:column;gap:22px;min-width:0}
        .av-create-section{min-width:0;background:#fff;border:1px solid #e0e8e3;border-radius:16px;box-shadow:0 2px 5px rgba(17,40,28,.025);overflow:hidden}
        .av-create-section-head{display:flex;align-items:flex-start;gap:12px;padding:22px 24px;border-bottom:1px solid #edf1ee}
        .av-create-section-icon{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:36px;height:36px;border-radius:10px;color:#16804a;background:#edf8f1}
        .av-create-section-head h2,.av-create-additional-title{font-size:15px;font-weight:750;line-height:1.5;letter-spacing:-.015em;margin:0;color:#183328}
        .av-create-section-head p,.av-create-additional-description{font-size:12.5px;font-weight:400;line-height:1.6;color:#617168;margin:3px 0 0}
        .av-create-section-body{padding:22px 24px 24px}
        .av-create-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 20px}
        .av-create-grid>div{min-width:0}.av-create-wide{grid-column:1/-1}
        .av-create label{display:block;font-size:12.5px;font-weight:650;margin-bottom:8px;line-height:1.5}
        .al-main .av-create input,.al-main .av-create textarea{box-sizing:border-box;display:block;width:100%;min-width:0;border:1px solid #cbd8cf!important;border-radius:9px;background:#fff;padding:11px 13px;font:inherit;font-size:13px;line-height:1.6;color:#193329!important;transition:border-color .15s,box-shadow .15s}
        .al-main .av-create input::placeholder,.al-main .av-create textarea::placeholder{color:#7a8880!important;opacity:1}
        .av-create textarea{resize:vertical;min-height:88px}
        .al-main .av-create input:focus,.al-main .av-create textarea:focus{outline:none;border-color:#169454!important;box-shadow:0 0 0 3px #e6f5ec}
        .al-main .av-create input[aria-invalid=true],.al-main .av-create textarea[aria-invalid=true]{border-color:#dc6a62!important}
        .av-create-field-error{color:#b42318;font-size:12px;line-height:1.5;margin:6px 0 0;overflow-wrap:anywhere}
        .av-create-help{font-size:12px;line-height:1.6;color:#64756b;margin:7px 0 0}
        .av-create-additional{display:flex;align-items:center;gap:12px;width:100%;border:0;padding:22px 24px;background:#fff;text-align:left;font:inherit;cursor:pointer;color:#53645a}
        .av-create-additional-heading{margin:0}.av-create-additional-copy{flex:1;min-width:0}.av-create-additional-title{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.av-create-additional-description{display:block}
        .av-create-optional{display:inline-flex;align-items:center;border:1px solid #e5ebe7;border-radius:5px;padding:2px 6px;background:#f7f9f8;color:#66776d;font-size:10px;font-weight:600;line-height:1.5;letter-spacing:0;white-space:nowrap}
        .av-create-additional[aria-expanded=true]{border-bottom:1px solid #edf1ee}
        .av-create-additional>svg,.av-create-url-toggle>svg:last-child{transition:transform .15s}
        .av-create-additional[aria-expanded=true]>svg,.av-create-url-toggle[aria-expanded=true]>svg:last-child{transform:rotate(180deg)}
        .av-create-sidebar .av-create-section-head{align-items:center;padding:20px;gap:10px}
        .av-create-sidebar .av-create-section-head .av-create-optional{margin-left:auto}
        .av-create-sidebar .av-create-section-body{padding:20px}
        .al-main .av-create .av-create-file-input{position:absolute;width:1px;height:1px;padding:0;border:0!important;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
        .av-create-upload{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;min-height:176px;border:1.5px dashed #b7d4c1;border-radius:12px;padding:22px 12px;background:#fafdfb;font:inherit;text-align:center;cursor:pointer;transition:background .15s,border-color .15s}
        .av-create-upload:hover:not(:disabled),.av-create-upload-active{background:#edf8f1;border-color:#169454}
        .av-create-upload-icon{display:flex;align-items:center;justify-content:center;width:46px;height:46px;background:#e8f5ed;border-radius:12px;color:#16804a;margin-bottom:14px}
        .av-create-upload-title{font-size:13px;font-weight:650;color:#167642;line-height:1.6}
        .av-create-upload-caption{font-size:11.5px;color:#687b6e;line-height:1.6;margin-top:4px}
        .av-create-logo-help{text-align:center;font-size:11px;line-height:1.6;color:#64756b;margin:10px 0 0}
        .av-create-logo-selected{text-align:center;background:#f8fbf9;border:1px solid #e0ebe4;border-radius:12px;padding:18px 12px}
        .av-create-logo-image{width:88px;height:88px;background:#fff;border:1px solid #e3ebe6;border-radius:14px;margin:0 auto 12px;padding:8px}
        .av-create-logo-image img{display:block;width:100%;height:100%;object-fit:contain}
        .av-create-logo-name{font-size:12px;font-weight:600;color:#374d40;margin:0;overflow-wrap:anywhere}
        .av-create-logo-selected .av-create-help{font-size:11px;margin-top:4px}
        .av-create-logo-controls{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:16px}
        .av-create-logo-replace,.av-create-logo-remove{display:inline-flex;align-items:center;gap:5px;background:none;border:0;padding:4px 0;font:inherit;font-size:12px;font-weight:600;color:#167642;cursor:pointer}
        .av-create-logo-remove{color:#a9433c}
        .av-create-logo-url{border-top:1px solid #edf1ee;margin-top:20px;padding-top:16px}
        .av-create-url-toggle{display:flex;align-items:center;gap:7px;border:0;padding:4px 0;background:none;font:inherit;font-size:12px;font-weight:600;color:#53675b;width:100%;text-align:left;cursor:pointer}
        .av-create-url-toggle>svg:last-child{margin-left:auto;flex-shrink:0}
        #add-vendor-logo-url{margin-top:14px}
        .av-create-publication .av-create-section-head{border-bottom:0;padding-bottom:0}
        .av-create-publication p{font-size:12px;line-height:1.75;color:#617168;margin:14px 0 0}
        .av-create-statuses{display:flex;gap:8px;flex-wrap:wrap}
        .av-create-status{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;font-size:11px;font-weight:600;line-height:1.5;border-radius:6px;background:#edf8f1;color:#167642}
        .av-create-status-neutral{background:#f1f4f2;color:#53675b}
        .av-create-error{display:flex;align-items:flex-start;gap:9px;padding:14px 16px;border:1px solid #f2ccc8;border-radius:10px;background:#fff5f4;color:#a32c22;font-size:13px;line-height:1.6;margin-top:20px}
        .av-create-error svg{flex-shrink:0;margin-top:2px}
        .av-create-footer{position:sticky;bottom:16px;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:20px;background:rgba(255,255,255,.97);border:1px solid #e0e8e3;border-radius:14px;padding:16px 20px;margin-top:22px;box-shadow:0 5px 20px rgba(17,40,28,.06)}
        .av-create-footer-note{display:flex;align-items:center;gap:8px;font-size:12px;line-height:1.6;color:#617168;margin:0}
        .av-create-footer-note svg{color:#16804a;flex-shrink:0}
        .av-create-actions{display:flex;gap:10px;flex-shrink:0}
        .av-create-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;min-height:44px;border-radius:9px;font:inherit;font-size:13px;font-weight:650;line-height:1.5;cursor:pointer;transition:background .15s}
        .av-create-cancel{border:1px solid #d6e0d9;background:#fff;color:#42574a}
        .av-create-cancel:hover:not(:disabled){background:#f5f8f6}
        .av-create-submit{border:1px solid #118343;background:#118343;color:#fff;box-shadow:0 2px 4px rgba(17,131,67,.12)}
        .av-create-submit:hover:not(:disabled){background:#0e7139}
        .av-create button:focus-visible{outline:2px solid #169454;outline-offset:3px}
        .av-create button:disabled{opacity:.6;cursor:not-allowed}.av-create input:disabled,.av-create textarea:disabled{background:#f7f9f8}
        .av-create-spinner{animation:av-create-spin .8s linear infinite}@keyframes av-create-spin{to{transform:rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){.av-create-spinner{animation:none}}
        @media(max-width:1100px){.av-create-layout{grid-template-columns:minmax(0,1fr)}.av-create-sidebar{display:grid;grid-template-columns:1fr 1fr;align-items:start}.av-create-footer-note{max-width:210px}}
        @media(max-width:640px){.al-main .av-create input,.al-main .av-create textarea{font-size:16px}.av-create-url-toggle,.av-create-logo-replace,.av-create-logo-remove{min-height:44px}.av-create-intro{align-items:flex-start;flex-direction:column;gap:5px}.av-create-layout,.av-create-main{gap:16px}.av-create-grid,.av-create-sidebar{grid-template-columns:1fr}.av-create-grid{gap:20px}.av-create-sidebar{gap:16px}.av-create-section-head,.av-create-additional{padding:18px}.av-create-section-body{padding:20px 18px}.av-create-section-head p,.av-create-additional-description{font-size:12px}.av-create-additional{gap:10px}.av-create-additional .av-create-section-icon{display:none}.av-create-footer{position:static;flex-direction:column;align-items:stretch;gap:14px;padding:18px;margin-top:16px}.av-create-footer-note{max-width:none}.av-create-actions{flex-direction:column-reverse}.av-create-button{width:100%}}
      `}</style>
      <div className="av-create-intro">
        <p>Add the company details to create a public vendor profile.</p>
        <span><span className="av-create-required">*</span> Required fields</span>
      </div>
      <div className="av-create-layout">
        <div className="av-create-main">
          <section className="av-create-section" aria-labelledby="av-company-heading">
            <div className="av-create-section-head">
              <span className="av-create-section-icon"><Building2 size={19} aria-hidden="true" /></span>
              <div><h2 id="av-company-heading">Company details</h2><p>Introduce the business and what it offers.</p></div>
            </div>
            <div className="av-create-section-body av-create-grid">{renderFields(COMPANY_FIELDS)}</div>
          </section>
          <section className="av-create-section" aria-labelledby="av-location-heading">
            <div className="av-create-section-head">
              <span className="av-create-section-icon"><MapPin size={19} aria-hidden="true" /></span>
              <div><h2 id="av-location-heading">Location & hours</h2><p>Help buyers find and connect with the business.</p></div>
            </div>
            <div className="av-create-section-body av-create-grid">{renderFields(LOCATION_FIELDS)}</div>
          </section>
          <section className="av-create-section" aria-labelledby="av-additional-heading">
            <h2 className="av-create-additional-heading" id="av-additional-heading"><button type="button" className="av-create-additional" aria-expanded={additionalOpen} aria-controls="av-additional-fields" onClick={() => setAdditionalOpen(open => !open)} disabled={saving}>
              <span className="av-create-section-icon"><SlidersHorizontal size={19} aria-hidden="true" /></span>
              <span className="av-create-additional-copy"><span className="av-create-additional-title">Additional details <span className="av-create-optional">Optional</span></span><span className="av-create-additional-description">Website, brand, sustainability and more.</span></span>
              <ChevronDown size={18} aria-hidden="true" />
            </button></h2>
            {additionalOpen && <div id="av-additional-fields" className="av-create-section-body av-create-grid">{renderFields(OPTIONAL_FIELDS)}</div>}
          </section>
        </div>
        <aside className="av-create-sidebar" aria-label="Logo and publication settings">
          <section className="av-create-section" aria-labelledby="av-logo-heading">
            <div className="av-create-section-head"><span className="av-create-section-icon"><ImagePlus size={19} aria-hidden="true" /></span><h2 id="av-logo-heading">Company logo</h2><span className="av-create-optional">Optional</span></div>
            <div className="av-create-section-body">{renderFields(REQUIRED_FIELDS.filter(field => field.key === "logo"))}</div>
          </section>
          <section className="av-create-section av-create-publication" aria-labelledby="av-publication-heading">
            <div className="av-create-section-head"><span className="av-create-section-icon"><Globe2 size={19} aria-hidden="true" /></span><h2 id="av-publication-heading">Publication</h2></div>
            <div className="av-create-section-body">
              <div className="av-create-statuses"><span className="av-create-status"><CheckCircle2 size={12} aria-hidden="true" />Approved</span><span className="av-create-status av-create-status-neutral">Unclaimed</span></div>
              <p>The profile appears in public vendor browsing as soon as you save. You can edit it on the next screen.</p>
              <p>No vendor login or verification badge is created.</p>
            </div>
          </section>
        </aside>
      </div>
      {error && <div className="av-create-error" role="alert"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
      {Object.values(fieldErrors).some(Boolean) && <div className="av-create-error" role="alert"><AlertCircle size={17} aria-hidden="true" /><span>Please check the highlighted fields before publishing.</span></div>}
      <div className="av-create-footer">
        <p className="av-create-footer-note"><Globe2 size={16} aria-hidden="true" />This profile will be visible to buyers.</p>
        <div className="av-create-actions">
          <button type="button" className="av-create-button av-create-cancel" onClick={() => router.push("/admin/vendors")} disabled={saving}>Cancel</button>
          <button type="submit" className="av-create-button av-create-submit" disabled={saving} aria-busy={saving}>
            {saving && <LoaderCircle size={16} className="av-create-spinner" aria-hidden="true" />}
            <span aria-live="polite">{uploadingLogo ? "Uploading logo…" : saving ? "Creating vendor…" : "Create and publish vendor"}</span>
            {!saving && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </form>
  );
}
