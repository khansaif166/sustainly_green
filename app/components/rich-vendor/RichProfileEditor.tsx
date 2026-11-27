"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment, useCallback, useEffect, useId, useRef, useState, type Dispatch, type FormEvent, type KeyboardEvent, type ReactNode, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowLeftRight, ArrowUpRight, Award, Building2, ChevronDown, CircleAlert, CircleCheck, Clapperboard, ClipboardList, ContactRound, FileText, Film, FolderOpen, Handshake, Image as ImageIcon, Images, Leaf, Link2, LoaderCircle, Megaphone, Newspaper, Package, Plus, ShieldCheck, Sparkles, Upload, UserRound, Users, Video, X, type LucideIcon } from "lucide-react";
import { getValidSession } from "@/lib/supabaseAuth";
import {
  AD_LIMITS, ASSET_LIMIT_MB, ASSET_MIME_TYPES, CERTIFICATE_SCOPES,
  MEDIA, PROFILE_ATTACHMENT_BATCH_LIMIT_MB, PROFILE_VIDEO_LIMIT, RICH_FIELDS, videoSource,
  type AdKind, type CatalogOptions, type EditorAd, type EditorData, type EditorMedia,
  type MediaPurpose, type RichContent, type RichFieldKey,
} from "@/lib/richVendorProfile";
import styles from "./editor.module.css";
import BusinessHoursField from "./BusinessHoursField";
import PeopleContactFields, { SocialLinksEditor } from "./PeopleContactFields";
import ProductsSourcingFields from "./ProductsSourcingFields";
import SustainabilityFields from "./SustainabilityFields";
import NewsEditor from "./NewsEditor";
import SingleDocumentCard from "./SingleDocumentCard";
import CoverImageCard from "./CoverImageCard";
import mediaStyles from "./coverImage.module.css";

type ApiData = { profile: EditorData; catalog: CatalogOptions };
type Save = (data: Record<string, unknown> | FormData, applySavedContent?: (content: RichContent) => void) => Promise<boolean>;
type UploadNewsImage = (file: File, title: string) => Promise<string>;
type FieldValue = NonNullable<RichContent["fields"][RichFieldKey]>;
type ProfileField = (typeof RICH_FIELDS)[number]["fields"][number];

function credentialRecords({ certificates, awards, memberships }: RichContent) {
  return { certificates, awards, memberships };
}

function withoutMediaAttachment(content: RichContent, id: string): RichContent {
  return {
    ...content,
    certificates: content.certificates.map(item => item.documentId === id ? { ...item, documentId: "" } : item),
    awards: content.awards.map(item => item.imageId === id ? { ...item, imageId: "" } : item),
    news: content.news.map(item => item.imageId === id ? { ...item, imageId: "" } : item),
  };
}

const companyPlaceholders: Partial<Record<RichFieldKey, string>> = {
  brandName: "The name buyers know you by",
  tagline: "A short line about what makes your business different",
  about: "Describe your business, the products or services you offer, and who you serve.",
  website: "https://www.example.com",
  mapUrl: "https://maps.google.com/…",
  udyam: "UDYAM-XX-00-0000000",
};

function CompanyProfileFields({ renderField, hours, admin }: {
  renderField: (field: ProfileField) => ReactNode;
  hours: ReactNode;
  admin: boolean;
}) {
  const id = useId();
  const fields = (keys: readonly RichFieldKey[]) => keys.map(key => {
    const field = RICH_FIELDS[0].fields.find(item => item.key === key);
    return field ? <div key={key} className={key === "industry" || key === "about" ? styles.companyWide : styles.companyField}>{renderField(field)}</div> : null;
  });
  return <div className={admin ? `${styles.companyForm} ${styles.companyProfile}` : styles.companyForm}>
    <div className={admin ? styles.companyProfileHeader : undefined}>
      {admin && <span className={styles.adminProfileIcon}><Building2 size={21} aria-hidden="true" /></span>}
      <div className={styles.companyIntro}>
        <h3>Company profile</h3>
        <p>{admin
          ? "Manage the business details buyers see on your Rich Profile."
          : "Help buyers understand your business and how to reach you. Add the details you want to share."}</p>
      </div>
    </div>
    <section className={styles.companySection} aria-labelledby={`${id}-identity`}>
      <div className={styles.companySectionHeader}><div><h4 id={`${id}-identity`}>Business identity</h4>
        {!admin && <p>Introduce your brand and what you do.</p>}
      </div></div>
      {admin ? (
        <div className={styles.companyIdentityFields}>
          <div className={styles.companyIdentityFacts}>{fields(["brandName", "tagline", "industry"])}</div>
          {fields(["about"])}
        </div>
      ) : <div className={styles.companyGrid}>{fields(["brandName", "tagline", "industry", "about"])}</div>}
    </section>
    <section className={styles.companySection} aria-labelledby={`${id}-online`}>
      <div className={styles.companySectionHeader}><div><h4 id={`${id}-online`}>Website & location</h4><p>Use complete links starting with https:// so buyers can find you.</p></div></div>
      <div className={styles.companyGrid}>{fields(["website", "mapUrl"])}</div>
    </section>
    {hours}
    <section className={styles.companySection} aria-labelledby={`${id}-details`}>
      <div className={styles.companySectionHeader}><div><h4 id={`${id}-details`}>Company details & customers</h4><p>Share your registration, team size, and the types of buyers you work with.</p></div></div>
      <div className={styles.companyGrid}>{fields(["udyam", "employeeBand", "customersServed", "buyersServed"])}</div>
    </section>
  </div>;
}

const editorSections = [
  { id: "details", title: "Profile details", tab: "Details", icon: ClipboardList },
  { id: "media", title: "Photos, videos and documents", tab: "Media", icon: FolderOpen },
  { id: "ads", title: "Advertising", tab: "Ads", icon: Megaphone },
] as const;

type EditorSection = (typeof editorSections)[number]["id"];

const detailSections = [
  { id: "company", title: "Company profile", icon: Building2 },
  { id: "people", title: "People and contact", icon: Users },
  { id: "products", title: "Products and sourcing", icon: Package },
  { id: "sustainability", title: "Sustainability", icon: Leaf },
  { id: "news", title: "News and updates", icon: Newspaper },
] as const;

type DetailSection = (typeof detailSections)[number]["id"];

const detailSectionByGroup: Record<(typeof RICH_FIELDS)[number]["title"], DetailSection> = {
  "Company profile": "company",
  "People and contact": "people",
  "Products and production": "products",
  "Sustainability and commercial preferences": "sustainability",
  "Procurement preferences": "products",
};

const mediaSections = [
  { id: "pdf", title: "Documents", icon: FileText },
  { id: "image", title: "Photos and logos", icon: ImageIcon },
  { id: "video", title: "Profile videos", icon: Video },
  { id: "credentials", title: "Credentials", icon: ShieldCheck },
] as const;

type MediaSection = (typeof mediaSections)[number]["id"];
type GeneralMediaPurpose = Exclude<MediaPurpose, "credential" | "award">;
const credentialSections = [
  { id: "certificates", title: "Certifications", icon: ShieldCheck },
  { id: "awards", title: "Awards", icon: Award },
  { id: "memberships", title: "Memberships", icon: Handshake },
] as const;
type CredentialSection = (typeof credentialSections)[number]["id"];

const mediaGroupIcons = {
  director: UserRound,
  contact: ContactRound,
  gallery: Images,
  partner: Handshake,
  intro: Clapperboard,
  video: Film,
} satisfies Partial<Record<MediaPurpose, LucideIcon>>;

const adSections = [
  { id: "banner", title: "Banner ads", icon: ImageIcon },
  { id: "video", title: "Promotional video ads", icon: Video },
] as const;

function SectionLayout<T extends string>({ label, sections, active, onSelect, children }: {
  label: string;
  sections: readonly { id: T; title: string; icon: LucideIcon }[];
  active: T;
  onSelect: (id: T) => void;
  children: (section: { id: T; title: string }) => ReactNode;
}) {
  const layoutId = useId();

  return (
    <div className={styles.detailLayout}>
      <div className={styles.detailNav} role="group" aria-label={label}>
        {sections.map(({ id, title, icon: Icon }) => (
          <button key={id} type="button" id={`${layoutId}-button-${id}`} aria-controls={`${layoutId}-section-${id}`}
            aria-pressed={active === id} onClick={() => onSelect(id)}>
            <Icon size={17} aria-hidden="true" />{title}
          </button>
        ))}
      </div>
      <div className={styles.detailPanels}>
        {sections.map(({ id, title }) => (
          <div key={id} id={`${layoutId}-section-${id}`} data-editor-section={id} role="region"
            aria-labelledby={`${layoutId}-button-${id}`} className={styles.detailSection} hidden={active !== id}>
            {children({ id, title })}
          </div>
        ))}
      </div>
    </div>
  );
}

async function callEditor<T>(url: string, body?: Record<string, unknown> | FormData): Promise<T> {
  const session = await getValidSession();
  if (!session) throw new Error("Sign in again to manage this Rich Profile.");
  const headers: Record<string, string> = { Authorization: `Bearer ${session.accessToken}` };
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(url, {
    method: body ? "PATCH" : "GET", headers, cache: "no-store",
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Could not save the Rich Profile.");
  return data;
}

function TextField({ label, value, onChange, type = "text", required, min, maxLength, pattern, inputMode }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: string;
  maxLength?: number; pattern?: string; inputMode?: "numeric";
}) {
  return <label>{label}<input type={type} value={value} required={required} min={min} inputMode={inputMode}
    maxLength={maxLength ?? (required ? 160 : type === "url" ? 2048 : undefined)} pattern={pattern ?? (required ? ".*\\S.*" : undefined)}
    placeholder={type === "url" ? "https://…" : undefined} onChange={event => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, options, onChange, empty = "Select…" }: {
  label: string; value: string; options: readonly (string | { id: string; name: string })[];
  onChange: (value: string) => void; empty?: string;
}) {
  const choices = options.map(option => typeof option === "string" ? { id: option, name: option } : option);
  if (value && !choices.some(choice => choice.id === value)) choices.unshift({ id: value, name: "Previously selected (unavailable)" });
  return (
    <label>{label}
      <select value={value} onChange={event => onChange(event.target.value)}>
        <option value="">{empty}</option>
        {choices.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}

function Repeated<T extends { name: string }>({ title, entryName, help, empty, items, max, editable, create, describe, onChange, onRemove, render, renderAttachment, existingFiles }: {
  title: string; entryName: string; help: string; empty: string; items: T[]; max: number; editable: boolean;
  create: () => T; describe: (item: T, index: number) => string[]; onChange: (next: T[]) => void;
  onRemove?: (index: number) => void;
  render: (item: T, change: (next: Partial<T>) => void, index: number) => ReactNode;
  renderAttachment?: (item: T, change: (next: Partial<T>) => void, index: number) => ReactNode;
  existingFiles?: { items: EditorMedia[]; create: (asset: EditorMedia) => T; remove?: (asset: EditorMedia) => void };
}) {
  const id = useId();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const rows = useRef<(HTMLDetailsElement | null)[]>([]);
  const addButton = useRef<HTMLButtonElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<{ index: number; input: boolean } | null>(null);
  useEffect(() => { if (confirming !== null) keepButton.current?.focus(); }, [confirming]);
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    if (!items.length) { addButton.current?.focus(); return; }
    rows.current[pending.index]?.querySelector<HTMLElement>(pending.input ? "input, select" : "summary")?.focus();
  }, [items.length]);
  function closeRow(index: number) {
    setExpanded(null);
    setConfirming(null);
    rows.current[index]?.querySelector("summary")?.focus();
  }
  function removeRow(index: number) {
    const nextIndex = Math.max(0, Math.min(index, items.length - 2));
    pendingFocus.current = { index: nextIndex, input: false };
    setExpanded(null);
    setConfirming(null);
    onRemove?.(index);
    onChange(items.filter((_, at) => at !== index));
  }
  const canAdd = editable && items.length < max;
  const removeFile = existingFiles?.remove;
  function addRow(item: T) {
    if (!canAdd) return;
    pendingFocus.current = { index: items.length, input: true };
    setConfirming(null);
    setExpanded(items.length);
    onChange([...items, item]);
  }

  return <section className={styles.credentialRecordGroup} aria-labelledby={`${id}-title`}>
      <div className={styles.credentialRecordHeader}>
        <div className={styles.companyIntro}>
          <h4 id={`${id}-title`}>{title}</h4>
          <p>{items.length >= max ? `Limit reached (${max}). Remove a record to add another.` : help}</p>
        </div>
        {editable && <button ref={addButton} className={styles.primary} type="button" disabled={!canAdd}
          onClick={() => addRow(create())}><Plus size={16} aria-hidden="true" />Add {entryName}</button>}
      </div>
      {!items.length && !existingFiles?.items.length && <p className={styles.credentialEmpty}>{empty}</p>}
      {items.map((item, index) => {
        const details = describe(item, index);
        const change = (next: Partial<T>) => onChange(items.map((row, at) => at === index ? { ...row, ...next } : row));
        return (
        <details key={index} ref={node => { rows.current[index] = node; }} className={`${styles.group} ${styles.credentialRecord}`} open={expanded === index}
          onToggle={event => {
            const open = event.currentTarget.open;
            setExpanded(current => open ? index : current === index ? null : current);
            if (!open) setConfirming(current => current === index ? null : current);
          }}>
          <summary>
            <span className={styles.credentialRecordCopy}>
              <strong>{item.name.trim() || `New ${entryName}`}</strong>
              {details.length > 0 && <span className={styles.credentialRecordMeta}>{details.join(" · ")}</span>}
            </span>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={styles.recordEditorBody}>
            <fieldset className={styles.companyGrid} disabled={!editable}>{render(item, change, index)}</fieldset>
            {renderAttachment?.(item, change, index)}
            {editable && (confirming === index ? <div className={styles.credentialConfirm} role="group" aria-label={`Remove ${entryName}`}>
              <p><strong>Remove {item.name}?</strong> This takes effect when you save changes.</p>
              <div className={styles.chips}>
                <button ref={keepButton} type="button" className={styles.small} onClick={() => {
                  setConfirming(null);
                  rows.current[index]?.querySelector("summary")?.focus();
                }}>Keep {entryName}</button>
                <button type="button" className={`${styles.small} ${styles.newsRemove}`} onClick={() => removeRow(index)}>Confirm removal</button>
              </div>
            </div> : <div className={styles.credentialRecordActions}>
              <button type="button" className={`${styles.small} ${styles.newsRemove}`}
                onClick={() => item.name.trim() ? setConfirming(index) : removeRow(index)}>Remove {entryName}</button>
              <button type="button" className={styles.small} onClick={() => closeRow(index)}>Done editing</button>
            </div>)}
          </div>
        </details>
        );
      })}
      {existingFiles?.items.map(asset => <ExistingCredentialFile key={asset.id} asset={asset}
        onAddDetails={canAdd ? () => addRow(existingFiles.create(asset)) : undefined}
        onRemove={removeFile && (() => removeFile(asset))} />)}
  </section>;
}

type ContentFieldsProps = {
  content: RichContent;
  setContent: Dispatch<SetStateAction<RichContent | null>>;
  profile: EditorData;
  catalog: CatalogOptions;
};

function RichContentForm({ children, admin, editable, busy, dirty, submit, saveLabel = "Save profile details", readOnlyPreview = false }: {
  children: ReactNode; admin: boolean; editable: boolean; busy: boolean; dirty: boolean;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  saveLabel?: string; readOnlyPreview?: boolean;
}) {
  const saveButton = editable && <button className={styles.primary} type="submit" disabled={admin && !dirty}>{saveLabel}</button>;
  return (
    <form data-rich-content-form noValidate onSubmit={submit}>
      <fieldset className={styles.stack} disabled={busy || (!editable && !readOnlyPreview)}>
        {children}
        {admin && saveButton ? (
          <div className={styles.adminSaveBar}>
            <span className={styles.adminSaveStatus} role="status" data-dirty={dirty && !busy}>
              {busy ? <LoaderCircle size={16} className={styles.loadingSpinner} aria-hidden="true" />
                : dirty ? <span className={styles.unsavedDot} aria-hidden="true" /> : <CircleCheck size={16} aria-hidden="true" />}
              {busy ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            {saveButton}
          </div>
        ) : saveButton}
      </fieldset>
    </form>
  );
}

type PendingAttachment = { kind: "award-image" | "certificate-pdf"; index: number; file?: File; error?: string };

function ExistingCredentialFile({ asset, onAddDetails, onRemove }: {
  asset: EditorMedia; onAddDetails?: () => void; onRemove?: () => void;
}) {
  const pdf = asset.purpose === "credential";
  return <details className={`${styles.group} ${styles.credentialRecord}`}>
    <summary>
      <span className={styles.credentialRecordCopy}>
        <strong>{asset.title}</strong>
        <span className={styles.credentialRecordMeta}>{pdf ? "Certificate PDF" : "Award image"}</span>
      </span>
      <ChevronDown size={17} aria-hidden="true" />
    </summary>
    <div className={styles.recordEditorBody}>
      <div className={styles.chips}>
        <Preview item={asset} type="asset" dialog />
        {onAddDetails && <button type="button" className={styles.small} onClick={onAddDetails}>Add details</button>}
        {onRemove && <button type="button" className={styles.assetRemove} onClick={onRemove}>Remove {pdf ? "PDF" : "image"}</button>}
      </div>
    </div>
  </details>;
}

function CertificatePdfField({ assets, documentId, selection, onSelect, onLink, onRemove }: {
  assets: EditorMedia[];
  documentId: string;
  selection?: PendingAttachment;
  onSelect: (selection?: Pick<PendingAttachment, "file" | "error">) => void;
  onLink: (documentId: string) => void;
  onRemove?: (asset: EditorMedia) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const asset = assets.find(item => item.id === documentId);
  const file = selection?.file;
  const atLimit = assets.length >= MEDIA.credential.limit;
  return <div className={styles.credentialAttachment} role="group" aria-labelledby={`${id}-label`}>
    <span id={`${id}-label`} className={styles.selectionLabel}>Certificate PDF <span className={styles.optionalLabel}>(optional)</span></span>
    <div className={styles.credentialFilePicker}>
      <span className={styles.credentialIcon}><FileText size={18} aria-hidden="true" /></span>
      <div className={styles.credentialRecordCopy} aria-live="polite">
        <strong>{file?.name || asset?.title || "No PDF attached"}</strong>
        <span className={styles.companyHelp} id={`${id}-help`}>
          {atLimit && onRemove ? "File limit reached. Remove an unused PDF in this tab."
            : file ? "Uploads when you save changes." : `PDF · Up to ${ASSET_LIMIT_MB.pdf} MB`}
        </span>
      </div>
      <div className={styles.chips}>
        {asset && !file && <Preview key={asset.id} item={asset} type="asset" dialog />}
        {onRemove && <>
          <input ref={input} type="file" hidden accept="application/pdf,.pdf" aria-label="Choose certificate PDF"
            aria-describedby={`${id}-help`} disabled={atLimit} onChange={event => {
              const next = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!next) return;
              if ((next.type && next.type !== "application/pdf") || !next.size || next.size > ASSET_LIMIT_MB.pdf * 1024 * 1024) {
                onSelect({ file, error: `Choose a PDF up to ${ASSET_LIMIT_MB.pdf} MB.` });
                return;
              }
              onSelect({ file: next.type ? next : new File([next], next.name, { type: "application/pdf", lastModified: next.lastModified }) });
            }} />
          <button type="button" className={styles.small} disabled={atLimit} data-invalid-attachment={selection?.error && !file ? "" : undefined}
            aria-describedby={selection?.error ? `${id}-error` : undefined} onClick={() => input.current?.click()}>
            <Upload size={16} aria-hidden="true" />{file || asset ? "Replace PDF" : "Choose PDF"}
          </button>
          {selection && <button type="button" className={styles.small} onClick={() => onSelect()}>Clear selection</button>}
          {asset && !file && <button type="button" className={styles.assetRemove} onClick={() => onRemove(asset)}>Remove PDF</button>}
        </>}
      </div>
    </div>
    {selection?.error && <p id={`${id}-error`} role="alert" className={styles.newsImageError}>{selection.error}</p>}
    {onRemove && assets.length > 0 && <SelectField label="Or choose a saved PDF" empty="No PDF" value={file ? "" : documentId}
      options={assets.map(item => ({ id: item.id, name: item.title }))} onChange={nextId => { onSelect(); onLink(nextId); }} />}
  </div>;
}

function LocalAwardPreview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const node = image.current;
    if (!node) return;
    const url = URL.createObjectURL(file);
    node.src = url;
    return () => { node.removeAttribute("src"); URL.revokeObjectURL(url); };
  }, [file]);
  return <img ref={image} className={styles.awardImageThumbnail} alt="Selected award image" />;
}

function AwardImageField({ assets, imageId, selection, onSelect, onLink, onRemove }: {
  assets: EditorMedia[];
  imageId: string;
  selection?: PendingAttachment;
  onSelect: (selection?: Pick<PendingAttachment, "file" | "error">) => void;
  onLink: (imageId: string) => void;
  onRemove?: (asset: EditorMedia) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const asset = assets.find(item => item.id === imageId);
  const file = selection?.file;
  const atLimit = assets.length >= MEDIA.award.limit;

  return <div className={styles.credentialAttachment} role="group" aria-labelledby={`${id}-label`}>
    <span id={`${id}-label`} className={styles.selectionLabel}>Award image <span className={styles.optionalLabel}>(optional)</span></span>
    <div className={styles.newsImagePicker} data-has-image={Boolean(file || asset)}>
      {file ? <LocalAwardPreview file={file} />
        : asset ? <Preview key={asset.id} item={asset} type="asset" dialog thumbnailClass={styles.awardImageThumbnail} />
        : <div className={styles.newsImagePlaceholder}><ImageIcon size={24} aria-hidden="true" /></div>}
      <div className={styles.newsImageActions}>
        <span className={styles.newsImageName}>{file?.name || asset?.title || "No image attached"}</span>
        {onRemove && <>
          <input ref={input} type="file" hidden accept={ASSET_MIME_TYPES.image.join(",")} aria-label="Choose award image"
            aria-describedby={`${id}-help`} disabled={atLimit} onChange={event => {
              const next = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!next) return;
              if (!(ASSET_MIME_TYPES.image as readonly string[]).includes(next.type) || !next.size || next.size > ASSET_LIMIT_MB.image * 1024 * 1024) {
                onSelect({ file, error: `Choose a JPEG, PNG, or WebP image up to ${ASSET_LIMIT_MB.image} MB.` });
                return;
              }
              onSelect({ file: next });
            }} />
          <div className={styles.chips}>
            <button type="button" className={styles.small} disabled={atLimit} data-invalid-attachment={selection?.error && !file ? "" : undefined}
              aria-describedby={selection?.error ? `${id}-error` : undefined} onClick={() => input.current?.click()}>
              <Upload size={16} aria-hidden="true" />{file || asset ? "Replace image" : "Upload image"}
            </button>
            {selection && <button type="button" className={styles.small} onClick={() => onSelect()}>Clear selected image</button>}
            {asset && !file && <button type="button" className={styles.assetRemove} onClick={() => onRemove(asset)}>Remove image</button>}
          </div>
        </>}
        {file && <span role="status" className={styles.companyHelp}>Uploads when you save changes.</span>}
      </div>
    </div>
    {onRemove && <p id={`${id}-help`} className={styles.companyHelp}>{atLimit
      ? "Image limit reached. Remove an unused image in this tab."
      : `JPEG, PNG, or WebP · Up to ${ASSET_LIMIT_MB.image} MB`}</p>}
    {selection?.error && <p id={`${id}-error`} role="alert" className={styles.newsImageError}>{selection.error}</p>}
    {onRemove && assets.length > 0 && <SelectField label="Or choose an existing award image" empty="No image" value={file ? "" : imageId}
      options={assets.map(item => ({ id: item.id, name: item.title }))} onChange={nextId => { onSelect(); onLink(nextId); }} />}
  </div>;
}

function CredentialRecords({ content, setContent, profile, catalog, attachments, setAttachments, active, onSelect, renderForm, save }: ContentFieldsProps & {
  attachments: PendingAttachment[];
  setAttachments: Dispatch<SetStateAction<PendingAttachment[]>>;
  active: CredentialSection;
  onSelect: (section: CredentialSection) => void;
  renderForm: (children: ReactNode) => ReactNode;
  save: Save;
}) {
  const titleId = useId();
  const availablePdfs = profile.media.filter(asset => asset.purpose === "credential");
  const awardImages = profile.media.filter(asset => asset.purpose === "award");
  const unlinkedPdfs = availablePdfs.filter(asset => !content.certificates.some(item => item.documentId === asset.id));
  const unlinkedImages = awardImages.filter(asset => !content.awards.some(item => item.imageId === asset.id));
  const counts = {
    certificates: content.certificates.length + unlinkedPdfs.length,
    awards: content.awards.length + unlinkedImages.length,
    memberships: content.memberships.length,
  };
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabId = (section: CredentialSection) => `${titleId}-tab-${section}`;
  const panelId = (section: CredentialSection) => `${titleId}-panel-${section}`;

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = credentialSections.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowLeft": next = index === 0 ? last : index - 1; break;
      case "ArrowRight": next = index === last ? 0 : index + 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      default: return;
    }
    event.preventDefault();
    onSelect(credentialSections[next].id);
    tabs.current[next]?.focus();
  }
  function selectAttachment(kind: PendingAttachment["kind"], index: number, selection?: Pick<PendingAttachment, "file" | "error">) {
    setAttachments(current => [
      ...current.filter(item => item.kind !== kind || item.index !== index),
      ...(selection ? [{ kind, index, ...selection }] : []),
    ]);
  }
  function removeRecord(kind: PendingAttachment["kind"], index: number) {
    setAttachments(current => current.filter(item => item.kind !== kind || item.index !== index)
      .map(item => item.kind === kind && item.index > index ? { ...item, index: item.index - 1 } : item));
  }
  function removeFile(asset: EditorMedia) {
    const linked = [content, profile.content].some(state => asset.purpose === "credential"
      ? state.certificates.some(item => item.documentId === asset.id)
      : state.awards.some(item => item.imageId === asset.id));
    if (window.confirm(`Remove “${asset.title}”? ${linked ? "This also removes the attachment from any record using it." : "This takes effect immediately."}`)) {
      void save({ action: "delete_media", id: asset.id });
    }
  }
  const onRemoveFile = profile.editable ? removeFile : undefined;
  const newCertificate = (): RichContent["certificates"][number] => ({
    name: "", bodyId: "", issuer: "", number: "", scope: "", issued: "", expires: "", proofUrl: "", documentId: "",
  });
  const newAward = (): RichContent["awards"][number] => ({ name: "", issuer: "", year: "", proofUrl: "", imageId: "" });

  const certificates = <Repeated<RichContent["certificates"][number]> title="Certification records" entryName="certification"
    help="Add certification details and attach an optional PDF." empty="No certification records yet."
    items={content.certificates} max={20} editable={profile.editable}
    describe={(item, index) => [
      catalog.bodies.find(body => body.id === item.bodyId)?.name || item.issuer,
      item.expires ? `Expires ${item.expires}` : "",
      attachments.some(file => file.kind === "certificate-pdf" && file.index === index && file.file)
        ? "PDF ready to upload" : item.documentId ? "PDF attached" : "",
    ].filter(Boolean)}
    create={newCertificate}
    onChange={certificates => setContent({ ...content, certificates })}
    onRemove={index => removeRecord("certificate-pdf", index)}
    render={(item, change) => <>
      <TextField label="Certificate name" required value={item.name} onChange={name => change({ name })} />
      <SelectField label="Certification body" value={item.bodyId} options={catalog.bodies} onChange={bodyId => change({ bodyId })} />
      <TextField label="Other issuer" value={item.issuer} maxLength={160} onChange={issuer => change({ issuer })} />
      <TextField label="Certificate number" value={item.number} maxLength={120} onChange={number => change({ number })} />
      <SelectField label="Scope" options={CERTIFICATE_SCOPES} value={item.scope} onChange={scope => change({ scope: scope as typeof item.scope })} />
      <TextField label="Issue date" type="date" value={item.issued} onChange={issued => change({ issued })} />
      <TextField label="Expiry date" type="date" min={item.issued || undefined} value={item.expires} onChange={expires => change({ expires })} />
      <TextField label="Public verification URL" type="url" value={item.proofUrl} onChange={proofUrl => change({ proofUrl })} />
    </>}
    renderAttachment={(item, change, index) => <CertificatePdfField assets={availablePdfs} documentId={item.documentId}
      selection={attachments.find(file => file.kind === "certificate-pdf" && file.index === index)}
      onSelect={selection => selectAttachment("certificate-pdf", index, selection)} onLink={documentId => change({ documentId })}
      onRemove={onRemoveFile} />}
    existingFiles={{ items: unlinkedPdfs, remove: onRemoveFile,
      create: asset => ({ ...newCertificate(), name: asset.title.slice(0, 160), documentId: asset.id }) }} />;
  const awards = <Repeated title="Awards and recognitions" entryName="award" help="Add awards with an optional image or proof link."
    empty="No awards yet." items={content.awards} max={20} editable={profile.editable}
    describe={(item, index) => [
      item.issuer, item.year,
      attachments.some(file => file.kind === "award-image" && file.index === index && file.file)
        ? "Image ready to upload" : item.imageId ? "Image attached" : "",
    ].filter(Boolean)}
    create={newAward}
    onChange={awards => setContent({ ...content, awards })}
    onRemove={index => removeRecord("award-image", index)}
    render={(item, change) => <>
      <TextField label="Award name" required value={item.name} onChange={name => change({ name })} />
      <TextField label="Issuing organization" value={item.issuer} maxLength={160} onChange={issuer => change({ issuer })} />
      <TextField label="Year" value={item.year} maxLength={4} inputMode="numeric" pattern="[12][0-9]{3}" onChange={year => change({ year })} />
      <TextField label="Proof URL" type="url" value={item.proofUrl} onChange={proofUrl => change({ proofUrl })} />
    </>}
    renderAttachment={(item, change, index) => <AwardImageField assets={awardImages} imageId={item.imageId}
      selection={attachments.find(item => item.kind === "award-image" && item.index === index)}
      onSelect={selection => selectAttachment("award-image", index, selection)} onLink={imageId => change({ imageId })}
      onRemove={onRemoveFile} />}
    existingFiles={{ items: unlinkedImages, remove: onRemoveFile,
      create: asset => ({ ...newAward(), name: asset.title.slice(0, 160), imageId: asset.id }) }} />;
  const memberships = <Repeated title="Trade associations and memberships" entryName="membership"
    help="Add an association and an optional link that verifies your membership."
    empty="No memberships yet." items={content.memberships} max={20} editable={profile.editable}
    describe={item => item.proofUrl ? ["Proof link added"] : []}
    create={() => ({ name: "", proofUrl: "" })} onChange={memberships => setContent({ ...content, memberships })}
    render={(item, change) => <>
      <TextField label="Association or membership" required value={item.name} onChange={name => change({ name })} />
      <TextField label="Proof URL" type="url" value={item.proofUrl} onChange={proofUrl => change({ proofUrl })} />
    </>} />;

  const records = { certificates, awards, memberships };
  return (
    <section className={styles.credentialWorkspace} aria-labelledby={titleId}>
      <div className={`${styles.companyProfileHeader} ${styles.credentialOverview}`}>
        <span className={styles.adminProfileIcon}><ShieldCheck size={21} aria-hidden="true" /></span>
        <div className={styles.companyIntro}>
          <h3 id={titleId}>Credentials</h3>
          <p>Manage the credentials buyers see on your Rich Profile.</p>
        </div>
      </div>
      <div className={styles.credentialTabs} role="tablist" aria-label="Credential categories">
        {credentialSections.map(({ id, title, icon: Icon }, index) => (
          <button key={id} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={tabId(id)}
            aria-selected={active === id} aria-controls={panelId(id)} tabIndex={active === id ? 0 : -1}
            onClick={() => onSelect(id)} onKeyDown={event => moveTab(event, index)}>
            <Icon size={16} aria-hidden="true" /><span>{title}</span><span className={styles.credentialCount}>{counts[id]}</span>
          </button>
        ))}
      </div>
      {renderForm(credentialSections.map(({ id }) => (
        <div key={id} id={panelId(id)} data-credential-section={id} role="tabpanel"
          aria-labelledby={tabId(id)} hidden={active !== id}>{records[id]}</div>
      )))}
    </section>
  );
}

function ProfileDetailFields({ content, setContent, catalog, admin, activeSection, onSelect, uploadNewsImage }: Omit<ContentFieldsProps, "profile"> & {
  admin: boolean;
  activeSection: DetailSection;
  onSelect: (section: DetailSection) => void;
  uploadNewsImage: UploadNewsImage;
}) {
  const update = (key: RichFieldKey, value: FieldValue) => setContent({ ...content, fields: { ...content.fields, [key]: value } });

  const renderField = (field: ProfileField) => {
    const value = content.fields[field.key];
    if (field.type === "boolean") {
      return <label className={styles.check} key={field.key}><input type="checkbox" checked={value === true} onChange={event => update(field.key, event.target.checked)} />{field.label}</label>;
    }
    if (field.type === "select") {
      return <SelectField key={field.key} label={field.label} value={String(value ?? "")} options={field.options} onChange={next => update(field.key, next)} />;
    }
    if (field.type === "list" && "options" in field) {
      const selected = Array.isArray(value) ? value : [];
      const max = "max" in field ? field.max : 20;
      return (
        <div className={styles.stack} key={field.key}>
          <SelectField label={`${field.label} (${selected.length}/${max})`} value="" options={selected.length < max ? field.options.filter(option => !selected.includes(option)) : []}
            onChange={next => { if (next) update(field.key, [...selected, next]); }} empty={selected.length < max ? "Add an option…" : "Limit reached"} />
          {selected.length > 0 && <div className={styles.chips}>{selected.map(item => (
            <button type="button" key={item} className={styles.small} onClick={() => update(field.key, selected.filter(option => option !== item))} aria-label={`Remove ${item}`}>{item} ×</button>
          ))}</div>}
        </div>
      );
    }
    if (field.type === "list") {
      return <TagField key={field.key} label={field.label} selected={Array.isArray(value) ? value : []} onChange={next => update(field.key, next)} />;
    }
    if (field.type === "long") {
      return <label key={field.key}>{field.label}<textarea rows={field.key === "about" ? 5 : 3} maxLength={6000}
        placeholder={companyPlaceholders[field.key]} value={String(value ?? "")} onChange={event => update(field.key, event.target.value)} /></label>;
    }
    return <label key={field.key}>{field.label}
      <input type={field.type === "text" && field.key === "email" ? "email" : field.type} min={field.type === "number" ? 0 : undefined}
        maxLength={"max" in field ? field.max : undefined} value={String(value ?? "")}
        placeholder={companyPlaceholders[field.key]}
        onChange={event => update(field.key, field.type === "number" && event.target.value ? Number(event.target.value) : event.target.value)} />
    </label>;
  };

  const socialLinks = <SocialLinksEditor items={content.socialLinks} onChange={socialLinks => setContent({ ...content, socialLinks })} />;
  const groups = RICH_FIELDS.filter(group => group.title !== "Procurement preferences").map((group, index) => {
    const company = group.title === "Company profile";
    const people = group.title === "People and contact";
    const products = group.title === "Products and production";
    const sustainability = group.title === "Sustainability and commercial preferences";
    const fields = company ? <CompanyProfileFields renderField={renderField} admin={admin}
      hours={<BusinessHoursField value={String(content.fields.hours ?? "")} onChange={value => update("hours", value)} />} />
      : people ? <PeopleContactFields fields={content.fields} onChange={update} />
        : products ? <ProductsSourcingFields fields={content.fields} categories={content.categories} catalog={catalog} onChange={update}
          onCategoriesChange={categories => setContent({ ...content, categories })} />
          : <SustainabilityFields fields={content.fields} onChange={update} claimStatus={content.claimStatus}
            onClaimStatusChange={admin ? claimStatus => setContent({ ...content, claimStatus }) : undefined} />;
    const node = admin ? (
      <section key={group.title} className={company || products || sustainability ? undefined : styles.detailGroup}>{fields}</section>
    ) : (
      <details key={group.title} className={styles.group} open={index === 0 ? true : undefined}>
        <summary>{products ? "Products and sourcing" : sustainability ? "Sustainability" : group.title}</summary>{fields}
      </details>
    );

    return { section: detailSectionByGroup[group.title], node };
  });

  const news = <NewsEditor active={!admin || activeSection === "news"} updates={content.news} onChange={news => setContent({ ...content, news })}
    onImageUpload={async (updateId, file) => {
      const title = content.news.find(item => item.id === updateId)?.headline || file.name;
      const imageId = await uploadNewsImage(file, title);
      setContent(current => current ? { ...current, news: current.news.map(item => item.id === updateId ? { ...item, imageId } : item) } : current);
      return imageId;
    }} />;
  const groupsIn = (section: DetailSection) => groups.filter(group => group.section === section).map(group => group.node);
  const sections: Record<DetailSection, ReactNode> = {
    company: groupsIn("company"),
    people: <>{groupsIn("people")}{socialLinks}</>,
    products: groupsIn("products"),
    news,
    sustainability: groupsIn("sustainability"),
  };

  return admin ? (
    <SectionLayout label="Profile detail sections" sections={detailSections} active={activeSection} onSelect={onSelect}>
      {({ id }) => sections[id]}
    </SectionLayout>
  ) : <>{groups.map(group => group.node)}{socialLinks}{news}</>;
}

function TagField({ label, selected, onChange }: { label: string; selected: string[]; onChange: (value: string[]) => void }) {
  const [entry, setEntry] = useState("");
  function add() {
    const value = entry.trim();
    if (value && !selected.includes(value) && selected.length < 20) onChange([...selected, value]);
    setEntry("");
  }
  return (
    <div className={styles.stack}>
      <label>{label}<input value={entry} maxLength={120} onChange={event => setEntry(event.target.value)}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }} /></label>
      <button className={styles.small} type="button" onClick={add} disabled={!entry.trim() || selected.length >= 20}>Add {label.toLowerCase()}</button>
      {selected.length > 0 && <div className={styles.chips}>{selected.map(item => (
        <button type="button" key={item} className={styles.small} onClick={() => onChange(selected.filter(option => option !== item))} aria-label={`Remove ${item}`}>{item} ×</button>
      ))}</div>}
    </div>
  );
}

function Preview({ item, type, dialog = false, thumbnailClass }: {
  item: EditorAd | EditorMedia; type: "asset" | "ad"; dialog?: boolean; thumbnailClass?: string;
}) {
  const thumbnail = Boolean(thumbnailClass);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const thumbnailRef = useRef<HTMLButtonElement>(null);
  const previewRequest = useRef<AbortController | null>(null);
  const previewUrl = useRef("");
  const titleId = useId();
  useEffect(() => () => {
    previewRequest.current?.abort();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);
  const preview = useCallback(async () => {
    if (previewRequest.current || previewUrl.current) return;
    const controller = new AbortController();
    previewRequest.current = controller;
    setError("");
    setLoading(true);
    try {
      const session = await getValidSession();
      if (controller.signal.aborted) return;
      if (!session) throw new Error("Sign in again to preview this file.");
      const response = await fetch(`/api/rich-vendor-media/${type}/${item.id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }, signal: controller.signal,
      });
      if (!response.ok) throw new Error("This file could not be opened.");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      previewUrl.current = URL.createObjectURL(blob);
      setUrl(previewUrl.current);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Preview unavailable.");
    } finally {
      if (previewRequest.current === controller) previewRequest.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [item.id, type]);

  useEffect(() => {
    const target = thumbnailRef.current;
    if (!thumbnail || !target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void preview();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [thumbnail, preview]);
  const source = item.sourceUrl ? videoSource(item.sourceUrl) : undefined;
  if (item.sourceUrl && (!dialog || !source)) {
    return source ? <a href={source.url} target="_blank" rel="noreferrer">Open video</a> : null;
  }
  const mediaClass = dialog ? styles.adPreviewMedia : styles.preview;
  const media = !url ? null : item.mimeType?.startsWith("image/")
    ? <img className={mediaClass} src={url} alt={item.title} />
    : item.mimeType?.startsWith("video/")
      ? <video className={mediaClass} src={url} aria-label={item.title} controls playsInline />
      : dialog && item.mimeType === "application/pdf" ? <div className={styles.pdfPreviewContent}>
        <div className={styles.chips}>
          <a href={url} target="_blank" rel="noreferrer">Open PDF in a new tab <ArrowUpRight size={14} aria-hidden="true" /></a>
          <a href={url} download={/\.pdf$/i.test(item.title) ? item.title : `${item.title}.pdf`}>Download PDF</a>
        </div>
        <object className={styles.pdfPreviewFrame} data={url} type="application/pdf" aria-label={`PDF preview: ${item.title}`}><p>Use the link above to open this PDF in your browser.</p></object>
      </div> : <a href={url} target="_blank" rel="noreferrer">Open document</a>;

  if (dialog) {
    return <>
      <button ref={thumbnail ? thumbnailRef : undefined} className={thumbnailClass ?? styles.adAction} type="button"
        aria-label={`Preview ${item.title}`} onClick={() => {
        dialogRef.current?.showModal();
        setPreviewOpen(true);
        if (!source && !url && !loading) void preview();
      }}>
        {thumbnail ? <>
          {url ? <img src={url} alt="" /> : <ImageIcon size={24} aria-hidden="true" />}
          <span>Preview</span>
        </> : "Preview"}
      </button>
      <dialog ref={dialogRef} className={`${styles.adPreviewDialog}${item.mimeType === "application/pdf" ? ` ${styles.pdfPreviewDialog}` : ""}`} aria-labelledby={titleId}
        onClose={event => {
          event.currentTarget.querySelector("video")?.pause();
          setPreviewOpen(false);
        }}>
        <div className={styles.adPreviewHeader}>
          <h4 id={titleId}>{item.title}</h4>
          <button className={styles.adAction} type="button" onClick={() => dialogRef.current?.close()}>Close</button>
        </div>
        {loading && <p role="status">Loading preview…</p>}
        {error && <>
          <p role="alert">{error}</p>
          <button className={styles.adAction} type="button" onClick={() => void preview()}>Retry preview</button>
        </>}
        {(!thumbnail || previewOpen) && media}
        {source && previewOpen && <>
          {source.embedded
            ? <iframe className={styles.adPreviewFrame} title={item.title} src={source.url}
              allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            : <video className={styles.adPreviewFrame} aria-label={item.title} src={source.url} controls playsInline preload="metadata" />}
          <a className={styles.adAction} href={item.sourceUrl ?? source.url} target="_blank" rel="noreferrer">
            Open in new tab <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </>}
      </dialog>
    </>;
  }
  if (media) return media;
  return <div>
    <button className={styles.small} type="button" onClick={() => void preview()} disabled={loading}>{loading ? "Loading…" : "Preview file"}</button>
    {error && <span role="alert">{error}</span>}
  </div>;
}

function checkImageUploadSize(input: HTMLInputElement) {
  const file = input.files?.[0];
  const limit = ASSET_LIMIT_MB.image;
  const tooLarge = file && file.size > limit * 1024 * 1024;
  input.setCustomValidity(tooLarge ? `Choose an image up to ${limit} MB.` : "");
  if (tooLarge) input.reportValidity();
}

function VideoUploadFields() {
  const id = useId();
  const [uploadFile, setUploadFile] = useState(true);

  return <>
    <div className={mediaStyles.videoSourceOptions} role="group" aria-label="Video source">
      <button type="button" aria-pressed={uploadFile} onClick={() => setUploadFile(true)}><Upload size={16} aria-hidden="true" />Upload file</button>
      <button type="button" aria-pressed={!uploadFile} onClick={() => setUploadFile(false)}><Link2 size={16} aria-hidden="true" />Paste link</button>
    </div>
    <label>Title<input name="title" required maxLength={120} /></label>
    <div hidden={!uploadFile}>
      <label>Video file<input type="file" name="file" accept={ASSET_MIME_TYPES.video.join(",")} required={uploadFile}
        disabled={!uploadFile} aria-describedby={id} /></label>
      <input type="hidden" name="sourceUrl" value="" disabled={!uploadFile} />
    </div>
    <div hidden={uploadFile}>
      <label>Video link<input type="url" name="sourceUrl" placeholder="https://…" required={!uploadFile} disabled={uploadFile}
        maxLength={2048} aria-describedby={id} /></label>
    </div>
    <p className={mediaStyles.videoSourceHelp} id={id}>{uploadFile
      ? `MP4 or WebM · Up to ${ASSET_LIMIT_MB.video} MB`
      : "YouTube, Vimeo, or a direct HTTPS link to an MP4 or WebM file"}</p>
  </>;
}

function MediaEditor({ profile, save, busy, admin, activeSection, onSelect, credentials }: {
  profile: EditorData; save: Save; busy: boolean; admin: boolean;
  activeSection: MediaSection; onSelect: (section: MediaSection) => void; credentials: ReactNode;
}) {
  const videoCount = profile.media.filter(item => item.purpose === "intro" || item.purpose === "video").length;
  const videoUsage = <div className={mediaStyles.videoUsage}>
    <div><h4>Profile videos</h4><p>The introduction counts toward this limit.</p></div>
    <span className={styles.assetStatus} data-uploaded={videoCount > 0}>{videoCount} of {PROFILE_VIDEO_LIMIT} used</span>
  </div>;
  const groups = (Object.entries(MEDIA) as [MediaPurpose, (typeof MEDIA)[MediaPurpose]][])
    .filter((group): group is [GeneralMediaPurpose, (typeof MEDIA)[GeneralMediaPurpose]] => group[0] !== "credential" && group[0] !== "award");

  function renderGroup([purpose, config]: (typeof groups)[number]) {
    const items = profile.media.filter(item => item.purpose === purpose);
    const canAdd = items.length < config.limit && (config.type !== "video" || videoCount < PROFILE_VIDEO_LIMIT);

    if (purpose === "cover") return <CoverImageCard key={purpose} item={items[0]} editable={profile.editable} busy={busy} save={save}
      preview={item => <Preview key={item.fileVersion || item.id} item={item} type="asset" dialog thumbnailClass={mediaStyles.coverThumbnail} />} />;

    if (purpose === "brochure" || purpose === "report") return <SingleDocumentCard key={purpose} purpose={purpose} items={items}
      active={!admin || activeSection === "pdf"} editable={profile.editable}
      busy={busy} onSave={save} preview={item => <Preview item={item} type="asset" dialog />} />;

    const isVideo = config.type === "video";
    const GroupIcon = mediaGroupIcons[purpose];
    const FileIcon = isVideo ? Video : ImageIcon;
    const count = purpose === "video" ? `${items.length} added` : `${items.length}/${config.limit}`;
    const accessibleCount = purpose === "video" ? count : `${items.length} of ${config.limit} ${isVideo ? "videos added" : "images uploaded"}`;
    const label = config.label;
    return <details className={mediaStyles.card} key={purpose}>
      <summary className={mediaStyles.summary} aria-label={`${label}, ${accessibleCount}`}>
        <span className={styles.assetIcon}><GroupIcon size={20} aria-hidden="true" /></span>
        <span className={mediaStyles.summaryTitle}>{label}</span>
        <span className={styles.assetStatus} data-uploaded={items.length > 0}>
          {count}
        </span>
        <ChevronDown className={styles.assetChevron} aria-hidden="true" />
      </summary>
      <div className={mediaStyles.body}>
        {items.map(item => <div className={mediaStyles.fileRow} key={item.id}>
          <div className={mediaStyles.fileIdentity}>
            <FileIcon size={18} aria-hidden="true" />
            {isVideo ? <div className={mediaStyles.videoFileDetails}>
              <strong>{item.title}</strong><p>{item.sourceUrl ? "Video link" : "Uploaded file"}</p>
            </div> : <strong>{item.title}</strong>}
          </div>
          <div className={styles.chips}>
            <Preview item={item} type="asset" dialog />
            {profile.editable && <button type="button" className={styles.assetRemove} disabled={busy}
              onClick={() => {
                if (window.confirm(`Remove “${item.title}”?`)) {
                  void save({ action: "delete_media", id: item.id });
                }
              }}>{isVideo ? "Remove video" : "Remove file"}</button>}
          </div>
        </div>)}
        {profile.editable && !canAdd && (isVideo
          ? <p className={mediaStyles.videoLimit}>{purpose === "intro" && items.length >= config.limit
            ? "Remove the current introduction video to add another."
            : "The shared video limit is full. Remove a video to add another."}</p>
          : <p>Limit reached. Remove an item to add another.</p>)}
        {profile.editable && canAdd && (
          <form className={mediaStyles.groupUpload} onSubmit={async event => {
            event.preventDefault();
            const form = event.currentTarget;
            if (await save(new FormData(form))) form.reset();
          }}>
            <fieldset disabled={busy} className={isVideo ? `${mediaStyles.uploadFields} ${mediaStyles.videoUploadFields}` : mediaStyles.uploadFields}>
              <input type="hidden" name="action" value="add_media" />
              <input type="hidden" name="purpose" value={purpose} />
              {isVideo ? <VideoUploadFields /> : <>
                <label>Title<input name="title" required maxLength={120} /></label>
                <label>File (up to {ASSET_LIMIT_MB.image} MB)
                  <input type="file" name="file" accept={ASSET_MIME_TYPES.image.join(",")} required
                    onChange={event => checkImageUploadSize(event.currentTarget)} />
                </label>
                <input type="hidden" name="sourceUrl" value="" />
              </>}
              <button type="submit" className={styles.primary}>{isVideo ? (admin ? "Save video" : "Add video") : (admin ? "Save media" : "Add media")}</button>
            </fieldset>
          </form>
        )}
      </div>
    </details>;
  }

  return admin ? (
    <SectionLayout label="Media sections" sections={mediaSections} active={activeSection} onSelect={onSelect}>
      {({ id }) => <>
        {id === "video" && videoUsage}
        {id === "credentials" ? credentials : groups.filter(([, config]) => config.type === id).map(renderGroup)}
      </>}
    </SectionLayout>
  ) : <div className={styles.stack}>
    {groups.map(group => group[0] === "intro" ? <Fragment key="profile-video-usage">
      {videoUsage}{renderGroup(group)}
    </Fragment> : renderGroup(group))}
    {credentials}
  </div>;
}

function AdForm({ kind, ad, busy, save, onSaved, admin = false }: {
  kind: AdKind; ad?: EditorAd; busy: boolean; save: Save; onSaved?: () => void; admin?: boolean;
}) {
  const assetType = kind === "banner" ? "image" : "video";
  const fileHelpId = useId();
  const showFileHelp = admin && kind === "banner";
  const fileLabel = showFileHelp ? (ad ? "Replace banner image" : "Banner image")
    : `${ad ? "Replace file" : "File"} (up to ${ASSET_LIMIT_MB[assetType]} MB)`;
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("enabled", String(data.get("enabled") === "true"));
    if (await save(data)) {
      if (!ad) form.reset();
      else {
        const file = form.elements.namedItem("file");
        const link = form.elements.namedItem("sourceUrl");
        if (file instanceof HTMLInputElement) file.value = "";
        if (link instanceof HTMLInputElement) link.value = "";
      }
      onSaved?.();
    }
  }
  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={busy} className={admin ? styles.adFormFields : styles.fields} data-kind={kind}>
        <input type="hidden" name="action" value="save_ad" />
        <input type="hidden" name="kind" value={kind} />
        {ad && <input type="hidden" name="id" value={ad.id} />}
        <label>Ad title<input name="title" required maxLength={120} defaultValue={ad?.title} /></label>
        <div className={styles.adFileField}>
          <label>{fileLabel}
            <input type="file" name="file" accept={ASSET_MIME_TYPES[assetType].join(",")} required={!ad && kind === "banner"}
              aria-describedby={showFileHelp ? fileHelpId : undefined}
              onChange={kind === "banner" ? event => checkImageUploadSize(event.currentTarget) : undefined} />
          </label>
          {showFileHelp && <span className={styles.adFileHelp} id={fileHelpId}>JPG, PNG or WebP · Up to {ASSET_LIMIT_MB.image} MB</span>}
        </div>
        {kind === "video" ? <label>{ad ? "Replace with a video URL" : "Or a YouTube, Vimeo, MP4 or WebM URL"}<input type="url" name="sourceUrl" /></label>
          : <input type="hidden" name="sourceUrl" value="" />}
        <label>Destination URL<input type="url" name="linkUrl" defaultValue={ad?.linkUrl ?? ""} /></label>
        <label>Display order<input type="number" name="sortOrder" min={0} max={9999} required defaultValue={ad?.sortOrder ?? 0} /></label>
        <div className={styles.adFormFooter}>
          <label className={admin ? styles.publishControl : styles.check}>
            <input type="checkbox" role={admin ? "switch" : undefined} name="enabled" value="true" defaultChecked={ad?.vendorEnabled ?? false} />
            {admin ? "Vendor enabled" : "Vendor switch on"}
          </label>
          <button type="submit" className={styles.primary}>{ad ? "Save ad" : "Add ad"}</button>
        </div>
      </fieldset>
    </form>
  );
}

function deleteAd(ad: EditorAd, save: Save) {
  if (window.confirm(`Delete “${ad.title}”?`)) void save({ action: "delete_ad", id: ad.id });
}

function AdminAdCard({ ad, status, editable, busy, save }: {
  ad: EditorAd; status: string; editable: boolean; busy: boolean; save: Save;
}) {
  const [editing, setEditing] = useState(false);
  const formId = useId();
  const Icon = ad.kind === "banner" ? ImageIcon : Video;

  return (
    <article className={styles.adCard}>
      <div className={styles.adCardRow}>
        <div className={styles.adIdentity}>
          <span className={styles.adTypeIcon}><Icon size={20} aria-hidden="true" /></span>
          <div>
            <div className={styles.adTitle}>
              <h4>{ad.title}</h4>
              <span className={styles.adStatus} data-ad-status={status}>{status}</span>
            </div>
            <p className={styles.adOrder}>Display order {ad.sortOrder}</p>
          </div>
        </div>
        <div className={styles.adActions}>
          <Preview key={ad.fileVersion || ad.sourceUrl || ad.id} item={ad} type="ad" dialog />
          {editable && <button type="button" className={styles.adAction} aria-expanded={editing} aria-controls={formId}
            disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Close editor" : "Edit ad"}</button>}
          <button type="button" className={styles.adAction} disabled={busy}
            onClick={() => void save({ action: "moderate", id: ad.id, enabled: !ad.adminEnabled })}>
            {ad.adminEnabled ? "Block ad" : "Lift admin block"}
          </button>
          {editable && <button type="button" className={`${styles.adAction} ${styles.adDelete}`} disabled={busy}
            onClick={() => deleteAd(ad, save)}>Delete ad</button>}
        </div>
      </div>
      {editable && <div id={formId} className={styles.adFormPanel} hidden={!editing}>
        <AdForm kind={ad.kind} ad={ad} busy={busy} save={save} onSaved={() => setEditing(false)} admin />
      </div>}
    </article>
  );
}

function AdminAdGroup({ kind, title, count, editable, busy, save, children }: {
  kind: AdKind; title: string; count: number; editable: boolean; busy: boolean; save: Save; children: ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const formId = useId();
  const canAdd = editable && count < AD_LIMITS[kind];
  const Icon = kind === "banner" ? ImageIcon : Video;

  return (
    <section className={styles.detailGroup}>
      <div className={styles.adsHeader}>
        <div className={styles.adIdentity}>
          <span className={styles.adTypeIcon}><Icon size={19} aria-hidden="true" /></span>
          <div>
            <h3>{title}</h3>
            <p className={styles.adOrder}>{count} of {AD_LIMITS[kind]} slots used</p>
          </div>
        </div>
        {canAdd && <button type="button" className={adding ? styles.adAction : styles.primary} aria-expanded={adding} aria-controls={formId}
          disabled={busy} onClick={() => setAdding(!adding)}>
          {adding ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {adding ? "Close form" : kind === "banner" ? "Add banner ad" : "Add video ad"}
        </button>}
      </div>
      {canAdd && <div id={formId} className={styles.adFormPanel} hidden={!adding}>
        <AdForm kind={kind} busy={busy} save={save} onSaved={() => setAdding(false)} admin />
      </div>}
      {count === 0 && !adding && <p className={styles.adEmpty}>No ads added yet.</p>}
      {children}
      {editable && !canAdd && <p className={styles.adOrder}>Limit reached. Delete an ad to add another.</p>}
    </section>
  );
}

function AdEditor({ profile, admin, busy, save }: { profile: EditorData; admin: boolean; busy: boolean; save: Save }) {
  const [activeSection, setActiveSection] = useState<AdKind>("banner");

  function renderAds({ id: kind, title }: { id: AdKind; title: string }) {
    const ads = profile.ads.filter(ad => ad.kind === kind && !ad.deleted);
    const archived = profile.ads.filter(ad => ad.kind === kind && ad.deleted);
    const items = <div className={styles.stack}>
      {ads.map(ad => {
        const status = !ad.adminEnabled ? "Blocked by admin" : !ad.vendorEnabled ? "Off" : profile.active && profile.approved ? "Running" : "Ready when public";

        if (admin) return <AdminAdCard key={ad.id} ad={ad} status={status} editable={profile.editable} busy={busy} save={save} />;

        return <div className={styles.item} key={ad.id}>
          <div className={styles.adHead}>
            <strong>{ad.title}</strong>
            <span data-ad-status={status}>{status}</span>
          </div>
          <Preview key={ad.fileVersion || ad.sourceUrl || ad.id} item={ad} type="ad" />
          {profile.editable && <details className={styles.group}><summary>Edit ad</summary><AdForm kind={kind} ad={ad} busy={busy} save={save} /></details>}
          <div className={styles.chips}>
            {profile.editable && <button type="button" className={styles.small} disabled={busy}
              onClick={() => deleteAd(ad, save)}>Delete ad</button>}
          </div>
        </div>;
      })}
      {archived.length > 0 && <details className={styles.group}>
        <summary>Deleted ads with admin blocks ({archived.length})</summary>
        {archived.map(ad => <div className={styles.adHead} key={ad.id}>
          <span>{ad.title}</span>
          <button type="button" className={styles.small} disabled={busy} onClick={() => void save({ action: "moderate", id: ad.id, enabled: true })}>Lift admin block</button>
        </div>)}
      </details>}
      {!admin && profile.editable && (ads.length < AD_LIMITS[kind]
        ? <details className={styles.group}><summary>Add {kind === "banner" ? "banner ad" : "video ad"}</summary><AdForm kind={kind} busy={busy} save={save} /></details>
        : <p>Limit reached. Delete an ad to add another.</p>)}
    </div>;

    if (admin) {
      return (
        <AdminAdGroup kind={kind} title={title} count={ads.length} editable={profile.editable} busy={busy} save={save}>
          {items}
        </AdminAdGroup>
      );
    }

    return <details className={styles.group} key={kind} open>
      <summary>{title} ({ads.length}/{AD_LIMITS[kind]})</summary>
      {items}
    </details>;
  }

  return admin ? (
    <SectionLayout label="Advertising sections" sections={adSections} active={activeSection} onSelect={setActiveSection}>
      {renderAds}
    </SectionLayout>
  ) : <div className={styles.stack}>{adSections.map(renderAds)}</div>;
}

function RichProfilePlaceholder() {
  return (
    <div className={styles.stack} aria-hidden="true">
      <div className={styles.adminTabs}>
        {editorSections.map(({ id }) => (
          <div className={styles.loadingTab} key={id}>
            <span className={styles.skeletonIcon} />
            <span className={styles.skeletonTabLabel} />
          </div>
        ))}
      </div>
      <div className={styles.detailLayout}>
        <div className={styles.detailNav}>
          {detailSections.map(({ id }) => (
            <div className={styles.loadingNavItem} key={id}>
              <span className={styles.skeletonIcon} />
              <span className={styles.skeletonTabLabel} />
            </div>
          ))}
        </div>
        <div className={styles.detailGroup}>
          <span className={styles.skeletonTitle} />
          <span className={styles.skeletonDescription} />
          <div className={styles.loadingFields}>
            {[0, 1].map(field => (
              <div key={field} className={styles.stack}>
                <span className={styles.skeletonTabLabel} />
                <span className={styles.skeletonInput} />
              </div>
            ))}
          </div>
          <span className={styles.skeletonTextArea} />
        </div>
      </div>
    </div>
  );
}

export default function RichProfileEditor({ adminVendorId, adminVendorApproved, onSaveSuccess }: {
  adminVendorId?: string;
  adminVendorApproved?: boolean;
  onSaveSuccess?: () => void;
}) {
  const admin = Boolean(adminVendorId);
  const url = adminVendorId ? `/api/admin/vendors/${encodeURIComponent(adminVendorId)}/rich-profile` : "/api/vendor/rich-profile";
  const editorId = useId();
  const [activeSection, setActiveSection] = useState<EditorSection>("details");
  const [detailSection, setDetailSection] = useState<DetailSection>("company");
  const [mediaSection, setMediaSection] = useState<MediaSection>("pdf");
  const [credentialSection, setCredentialSection] = useState<CredentialSection>("certificates");
  const editorRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<ApiData | null>(null);
  const [content, setContent] = useState<RichContent | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [revision, setRevision] = useState(0);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const newsImageInFlight = useRef(false);

  useEffect(() => {
    let current = true;
    callEditor<ApiData>(url).then(next => {
      if (!current) return;
      setData(next);
      setContent(next.profile.draftContent ?? next.profile.content);
      setAttachments([]);
      setRevision(next.profile.revision);
      setFailure("");
    }).catch(error => { if (current) setFailure(error.message); });
    return () => { current = false; };
  }, [url, reload]);

  const save: Save = async (input, applySavedContent) => {
    setBusy(true);
    setFailure("");
    setNotice("");
    try {
      const { id } = await callEditor<{ id: string | null }>(url, input);
      if (input instanceof FormData && ["add_media", "replace_cover"].includes(String(input.get("action"))) && id) {
        const purpose = input.get("purpose");
        if (purpose === "credential" || purpose === "brochure" || purpose === "report" || purpose === "cover") {
          const file = input.get("file");
          const media: EditorMedia = { id, purpose, title: String(input.get("title")).trim(), sourceUrl: null,
            mimeType: file instanceof File ? file.type : "application/pdf", fileVersion: crypto.randomUUID() };
          setData(current => current && {
            ...current, profile: { ...current.profile, media: [...current.profile.media.filter(item => item.id !== id), media] },
          });
        }
      } else if (!(input instanceof FormData) && input.action === "delete_media" && typeof input.id === "string") {
        const removedId = input.id;
        setData(current => current && {
          ...current,
          profile: {
            ...current.profile,
            media: current.profile.media.filter(item => item.id !== removedId),
            content: withoutMediaAttachment(current.profile.content, removedId),
          },
        });
        setContent(current => current && withoutMediaAttachment(current, removedId));
      }
      if (onSaveSuccess) onSaveSuccess();
      else setNotice("Changes saved.");
      try {
        const next = await callEditor<ApiData>(url);
        setData(next);
        if (applySavedContent) {
          applySavedContent(next.profile.content);
          setRevision(next.profile.revision);
        }
      } catch {
        setFailure("Changes were saved. Reload this editor to see the latest state.");
      }
      return true;
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Could not save changes.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const uploadNewsImage: UploadNewsImage = async (file, title) => {
    if (busy || newsImageInFlight.current) throw new Error("Wait for the current operation to finish, then try again.");
    if ((data?.profile.media.filter(item => item.purpose === "gallery").length ?? 0) >= MEDIA.gallery.limit) {
      throw new Error("Image limit reached. Remove an unused image in Media before uploading another.");
    }
    newsImageInFlight.current = true;
    setBusy(true);
    setFailure("");
    setNotice("");
    try {
      const form = new FormData();
      const imageTitle = title.trim().slice(0, 120) || "News update image";
      form.set("action", "add_news_image");
      form.set("title", imageTitle);
      form.set("file", file);
      const result = await callEditor<{ id: string | null }>(url, form);
      if (!result.id) throw new Error("The upload did not return an image. Try again.");
      const imageId = result.id;
      setData(current => current ? {
        ...current,
        profile: { ...current.profile, media: [...current.profile.media, { id: imageId, purpose: "gallery", title: imageTitle, sourceUrl: null, mimeType: file.type }] },
      } : current);
      return imageId;
    } finally {
      newsImageInFlight.current = false;
      setBusy(false);
    }
  };

  const editorClass = admin ? `${styles.editor} ${styles.adminEditor}` : styles.editor;
  if (!data || !content) {
    const retry = () => {
      setFailure("");
      setReload(count => count + 1);
    };
    if (!admin) return <section className={editorClass}>
      <h2>Rich Profile</h2>
      {failure ? <><p role="alert">{failure}</p><button className={styles.small} type="button" onClick={retry}>Retry</button></> : <p role="status">Loading Rich Profile…</p>}
    </section>;

    return (
      <section className={editorClass} aria-labelledby={`${editorId}-title`}>
        <div className={styles.adminHeading}>
          <div className={styles.adminIdentity}>
            <span className={styles.adminProfileIcon} data-error={Boolean(failure)} aria-hidden="true">
              {failure ? <CircleAlert size={21} /> : <LoaderCircle size={21} className={styles.loadingSpinner} />}
            </span>
            <div>
              <h2 id={`${editorId}-title`}>Rich Profile</h2>
              {failure ? <p role="alert">{failure}</p> : <p role="status">Loading editor…</p>}
            </div>
          </div>
          {failure && <button className={styles.small} type="button" onClick={retry}>Try again</button>}
        </div>
        {!failure && <RichProfilePlaceholder />}
      </section>
    );
  }

  const { catalog } = data;
  const profile = admin && adminVendorApproved !== undefined
    ? { ...data.profile, approved: adminVendorApproved }
    : data.profile;
  const savedCredentials = credentialRecords(profile.content);
  const draftCredentials = credentialRecords(content);
  const credentialsDirty = attachments.length > 0 || JSON.stringify(draftCredentials) !== JSON.stringify(savedCredentials);
  const detailsDirty = JSON.stringify({ ...content, ...savedCredentials }) !== JSON.stringify(profile.content);

  async function submitContent(event: FormEvent<HTMLFormElement>, section: "details" | "credentials") {
    event.preventDefault();
    const savingCredentials = section === "credentials";
    if (busy || !profile.editable || !content || (admin && !(savingCredentials ? credentialsDirty : detailsDirty))) return;
    const editor = editorRef.current;
    const invalid = event.currentTarget.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      ":is(input, select, textarea):invalid",
    );
    if (invalid) {
      const section = invalid.closest("[data-editor-section]")?.getAttribute("data-editor-section");
      const credential = credentialSections.find(({ id }) => id === invalid.closest("[data-credential-section]")?.getAttribute("data-credential-section"));
      if (credential) {
        flushSync(() => {
          setCredentialSection(credential.id);
          if (admin) { setActiveSection("media"); setMediaSection("credentials"); }
        });
      } else if (admin) {
        const target = detailSections.find(item => item.id === section);
        if (target) flushSync(() => { setActiveSection("details"); setDetailSection(target.id); });
      }
      for (let details = invalid.closest("details"); details && editor?.contains(details); details = details.parentElement?.closest("details") ?? null) {
        details.open = true;
      }
      invalid.focus();
      invalid.reportValidity();
      return;
    }
    const payload = { action: "content", revision, content: savingCredentials
      ? { ...profile.content, ...draftCredentials } : { ...content, ...savedCredentials } };
    const applySavedContent = (saved: RichContent) => {
      setContent(current => {
        if (!current) return saved;
        if (savingCredentials) return detailsDirty ? { ...current, ...credentialRecords(saved) } : saved;
        return credentialsDirty ? { ...saved, ...credentialRecords(current) } : saved;
      });
    };
    const selectedFiles = savingCredentials ? attachments.filter(attachment => attachment.file) : [];
    if (savingCredentials && attachments.some(attachment => attachment.error && !attachment.file)) {
      const picker = event.currentTarget.querySelector<HTMLButtonElement>("[data-invalid-attachment]");
      const group = picker?.closest<HTMLElement>("[data-credential-section]")?.dataset.credentialSection;
      if (group === "certificates" || group === "awards") flushSync(() => setCredentialSection(group));
      const row = picker?.closest("details");
      if (row) row.open = true;
      picker?.focus();
      return;
    }
    if (!selectedFiles.length) {
      if (await save(payload, applySavedContent) && savingCredentials) setAttachments([]);
      return;
    }
    const hasAwardImages = selectedFiles.some(item => item.kind === "award-image");
    for (const [kind, purpose] of [["certificate-pdf", "credential"], ["award-image", "award"]] as const) {
      const pending = selectedFiles.filter(item => item.kind === kind).length;
      const existing = profile.media.filter(item => item.purpose === purpose).length;
      if (pending && pending + existing > MEDIA[purpose].limit) {
        setNotice("");
        setFailure(`Only ${Math.max(0, MEDIA[purpose].limit - existing)} new ${kind === "certificate-pdf" ? "certificate PDFs" : "award images"} can fit. Clear some selections or remove unused files from the ${kind === "certificate-pdf" ? "Certifications" : "Awards"} tab.`);
        return;
      }
    }
    const selectedBytes = selectedFiles.reduce((bytes, item) => bytes + (item.file?.size ?? 0), 0);
    if (selectedBytes > PROFILE_ATTACHMENT_BATCH_LIMIT_MB * 1024 * 1024) {
      setNotice("");
      setFailure(`Upload up to ${PROFILE_ATTACHMENT_BATCH_LIMIT_MB} MB of ${hasAwardImages ? "attachments" : "certificate PDFs"} per save. Clear some selections and upload them after saving the rest.`);
      return;
    }
    const form = new FormData();
    form.set("action", hasAwardImages ? "save_content_attachments" : "save_certificate_pdfs");
    form.set("payload", JSON.stringify(payload));
    for (const item of selectedFiles) if (item.file) form.set(`${item.kind}:${item.index}`, item.file);
    if (await save(form, applySavedContent)) setAttachments([]);
  }

  const formProps = { admin, editable: profile.editable, busy };
  const editorContent: Record<EditorSection, ReactNode> = {
    details: (
      <RichContentForm {...formProps} dirty={detailsDirty} submit={event => void submitContent(event, "details")}>
        <ProfileDetailFields content={content} setContent={setContent} catalog={catalog} admin={admin}
          activeSection={detailSection} onSelect={setDetailSection} uploadNewsImage={uploadNewsImage} />
      </RichContentForm>
    ),
    media: (
      <MediaEditor profile={profile} admin={admin} busy={busy} save={save} activeSection={mediaSection} onSelect={setMediaSection}
        credentials={<CredentialRecords content={content} setContent={setContent} catalog={catalog} profile={profile} save={save}
          attachments={attachments} setAttachments={setAttachments} active={credentialSection} onSelect={setCredentialSection}
          renderForm={children => <RichContentForm {...formProps} dirty={credentialsDirty} readOnlyPreview
            submit={event => void submitContent(event, "credentials")} saveLabel="Save changes">{children}</RichContentForm>} />} />
    ),
    ads: <AdEditor profile={profile} admin={admin} busy={busy} save={save} />,
  };
  const richIsLive = profile.active && profile.approved;
  const status = profile.active
    ? profile.approved ? "Live" : "Enabled"
    : profile.approved ? "Basic Profile live" : "Basic Profile selected";
  const tabId = (key: EditorSection) => `${editorId}-tab-${key}`;
  const panelId = (key: EditorSection) => `${editorId}-panel-${key}`;

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = editorSections.length - 1;
    let next = index;
    switch (event.key) {
      case "ArrowLeft": next = index === 0 ? last : index - 1; break;
      case "ArrowRight": next = index === last ? 0 : index + 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      default: return;
    }
    event.preventDefault();
    const section = editorSections[next].id;
    setActiveSection(section);
    document.getElementById(tabId(section))?.focus();
  }

  return (
    <section ref={editorRef} className={editorClass} aria-labelledby={`${editorId}-title`}>
      <div className={admin ? styles.adminHeading : styles.heading}>
        {admin ? (
          <div className={styles.adminIdentity}>
            <span className={styles.adminProfileIcon}><Sparkles size={21} aria-hidden="true" /></span>
            <div>
              <div className={styles.headingTitle}>
                <h2 id={`${editorId}-title`}>Rich Profile</h2>
                <span className={styles.profileStatus} data-live={richIsLive}>{status}</span>
              </div>
              {!profile.approved && <p>The public page becomes available after vendor approval.</p>}
            </div>
          </div>
        ) : (
          <div>
            <h2 id={`${editorId}-title`}>Rich Profile</h2>
            <p>{profile.active ? profile.approved ? "Active on the public vendor page." : "Enabled. The vendor page appears after approval."
              : "Your Rich Profile is inactive. Saved details are read-only."}</p>
          </div>
        )}
        <div className={admin ? styles.adminActions : styles.chips}>
          {admin && <button className={styles.adminProfileAction} data-activate={!profile.active} type="button" disabled={busy}
            onClick={() => void save({ action: "activate", active: !profile.active })}>
            {profile.active && <ArrowLeftRight size={15} aria-hidden="true" />}
            {profile.active ? (profile.approved ? "Publish Basic Profile" : "Select Basic Profile") : "Activate Rich Profile"}
          </button>}
          {profile.approved && <Link className={admin ? styles.adminPreview : undefined} href={profile.href} prefetch={false} rel="noreferrer" target="_blank">
            View public profile {admin && <ArrowUpRight size={15} aria-hidden="true" />}
          </Link>}
        </div>
      </div>
      {(notice || failure) && <div className={styles.feedback} role={failure ? "alert" : "status"}>
        <span>{failure || notice}</span>
        {failure && <button className={styles.small} type="button" disabled={busy} onClick={() => setReload(count => count + 1)}>Reload editor</button>}
      </div>}
      {admin && activeSection === "details" && profile.draftContent && (
        <p className={styles.prefillNotice}>Filled from existing vendor data. Review and save the profile details to apply.</p>
      )}
      {admin ? <>
        <div className={styles.adminTabs} role="tablist" aria-label="Rich Profile sections">
          {editorSections.map(({ id, tab, icon: Icon }, index) => (
            <button key={id} type="button" role="tab" id={tabId(id)} aria-controls={panelId(id)}
              aria-selected={activeSection === id} tabIndex={activeSection === id ? 0 : -1}
              onClick={() => setActiveSection(id)} onKeyDown={event => navigateTabs(event, index)}>
              <Icon size={17} aria-hidden="true" />{tab}
            </button>
          ))}
        </div>
        {editorSections.map(({ id }) => (
          <div key={id} className={styles.adminPanel} role="tabpanel" id={panelId(id)} aria-labelledby={tabId(id)} hidden={activeSection !== id}>
            {editorContent[id]}
          </div>
        ))}
      </> : editorSections.map(({ id, title }) => (
        <details className={styles.group} key={id}><summary>{title}</summary>{editorContent[id]}</details>
      ))}
    </section>
  );
}
