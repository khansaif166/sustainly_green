"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowUpRight, Building2, ClipboardList, FileText, FolderOpen, Image, Leaf, Megaphone, Newspaper, Package, Plus, Users, Video, type LucideIcon } from "lucide-react";
import { getValidSession } from "@/lib/supabaseAuth";
import {
  AD_LIMITS, ASSET_LIMIT_MB, ASSET_MIME_TYPES, CERTIFICATE_SCOPES, CLAIM_STATUSES,
  MEDIA, NEWS_BODY_LIMIT, NEWS_HEADLINE_LIMIT, PROFILE_VIDEO_LIMIT, RICH_FIELDS, SOCIAL_PLATFORMS, videoSource,
  type AdKind, type AssetType, type CatalogOptions, type EditorAd, type EditorData, type EditorMedia,
  type MediaPurpose, type RichContent, type RichFieldKey, type RichNewsUpdate,
} from "@/lib/richVendorProfile";
import styles from "./editor.module.css";

type ApiData = { profile: EditorData; catalog: CatalogOptions };
type Save = (data: Record<string, unknown> | FormData, refreshContent?: boolean) => Promise<boolean>;
type FieldValue = NonNullable<RichContent["fields"][RichFieldKey]>;

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
  { id: "image", title: "Photos and logos", icon: Image },
  { id: "video", title: "Profile videos", icon: Video },
] as const;

const adSections = [
  { id: "banner", title: "Banner ads", icon: Image },
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

function TextField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; type?: string;
}) {
  return <label>{label}<input type={type} value={value} onChange={event => onChange(event.target.value)} /></label>;
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

function Repeated<T>({ title, items, max, create, onChange, render }: {
  title: string; items: T[]; max: number; create: () => T; onChange: (next: T[]) => void;
  render: (item: T, change: (next: Partial<T>) => void) => ReactNode;
}) {
  return <details className={styles.group}>
    <summary>{title} ({items.length}/{max})</summary>
    <div className={styles.stack}>
      {items.map((item, index) => (
        <div className={styles.item} key={index}>
          <div className={styles.fields}>{render(item, next => onChange(items.map((row, at) => at === index ? { ...row, ...next } : row)))}</div>
          <button type="button" className={styles.small} onClick={() => onChange(items.filter((_, at) => at !== index))}>Remove entry {index + 1}</button>
        </div>
      ))}
      {items.length < max && <button type="button" className={styles.small} onClick={() => onChange([...items, create()])}>Add entry</button>}
    </div>
  </details>;
}

function NewsForm({ updates, images, onChange }: {
  updates: RichNewsUpdate[];
  images: { id: string; name: string }[];
  onChange: (updates: RichNewsUpdate[]) => void;
}) {
  const [newEntryId, setNewEntryId] = useState<string | null>(null);

  function addUpdate() {
    const id = crypto.randomUUID();
    setNewEntryId(id);
    onChange([...updates, { id, headline: "", body: "", date: new Date().toISOString().slice(0, 10), imageId: "", sourceUrl: "", published: false }]);
  }

  function update(id: string, changes: Partial<RichNewsUpdate>) {
    onChange(updates.map(item => item.id === id ? { ...item, ...changes } : item));
  }

  return <section className={styles.detailGroup}>
    <div className={styles.newsHeader}>
      <h3>News and updates</h3>
      <button type="button" className={styles.small} onClick={addUpdate}><Plus size={16} aria-hidden="true" /> Add update</button>
    </div>
    <p className={styles.newsHelp}>Published updates go live when you save profile details.</p>
    {updates.map(item => <details className={styles.group} key={item.id} open={item.id === newEntryId ? true : undefined}>
      <summary>
        <span className={styles.newsSummary}>
          <span>{item.headline || "New update"}</span>
          <span className={styles.profileStatus} data-live={item.published}>{item.published ? "Published" : "Draft"}</span>
        </span>
      </summary>
      <div className={styles.stack}>
        <div className={styles.fields}>
          <label>Headline
            <input value={item.headline} maxLength={NEWS_HEADLINE_LIMIT} required={item.published}
              onChange={event => update(item.id, { headline: event.target.value })} />
          </label>
          <label>Display date
            <input type="date" value={item.date} required={item.published} onChange={event => update(item.id, { date: event.target.value })} />
          </label>
          <label className={styles.newsBody}>Update text
            <textarea rows={5} maxLength={NEWS_BODY_LIMIT} required={item.published} value={item.body}
              onChange={event => update(item.id, { body: event.target.value })} />
          </label>
          <SelectField label="Gallery image" value={item.imageId} options={images} empty="No image"
            onChange={imageId => update(item.id, { imageId })} />
          <label>Source URL
            <input type="url" maxLength={2048} value={item.sourceUrl} onChange={event => update(item.id, { sourceUrl: event.target.value })} />
          </label>
        </div>
        <div className={styles.newsHeader}>
          <label className={styles.check}><input type="checkbox" checked={item.published}
            onChange={event => update(item.id, { published: event.target.checked })} /> Show on public profile</label>
          <button type="button" className={`${styles.small} ${styles.newsRemove}`}
            onClick={() => onChange(updates.filter(entry => entry.id !== item.id))}>Remove update</button>
        </div>
      </div>
    </details>)}
  </section>;
}

function ContentForm({ content, setContent, profile, catalog, admin, busy, save, revision }: {
  content: RichContent; setContent: (next: RichContent) => void; profile: EditorData;
  catalog: CatalogOptions; admin: boolean; busy: boolean; save: Save; revision: number;
}) {
  const [activeSection, setActiveSection] = useState<DetailSection>("company");
  const dirty = admin && content !== profile.content && JSON.stringify(content) !== JSON.stringify(profile.content);
  const update = (key: RichFieldKey, value: FieldValue) => setContent({ ...content, fields: { ...content.fields, [key]: value } });
  const assetChoices = (purpose: MediaPurpose) => profile.media.filter(asset => asset.purpose === purpose)
    .map(asset => ({ id: asset.id, name: asset.title }));
  const saveButton = profile.editable && <button className={styles.primary} type="submit" disabled={admin && !dirty}>Save profile details</button>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !profile.editable || (admin && !dirty)) return;
    const form = event.currentTarget;
    const invalid = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(":is(input, select, textarea):invalid");
    if (invalid) {
      if (admin) {
        const panel = invalid.closest("[data-editor-section]");
        const section = detailSections.find(item => item.id === panel?.getAttribute("data-editor-section"));
        if (section && section.id !== activeSection) flushSync(() => setActiveSection(section.id));
      }
      for (let details = invalid.closest("details"); details && form.contains(details); details = details.parentElement?.closest("details") ?? null) {
        details.open = true;
      }
      invalid.focus();
      invalid.reportValidity();
      return;
    }
    void save({ action: "content", revision, content }, true);
  }

  const groups = RICH_FIELDS.map((group, index) => {
    const fields = <div className={styles.fields}>
      {group.fields.map(field => {
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
          return <label key={field.key}>{field.label}<textarea rows={3} maxLength={6000} value={String(value ?? "")} onChange={event => update(field.key, event.target.value)} /></label>;
        }
        return <label key={field.key}>{field.label}
          <input type={field.type === "text" && field.key === "email" ? "email" : field.type} min={field.type === "number" ? 0 : undefined}
            maxLength={"max" in field ? field.max : undefined} value={String(value ?? "")}
            onChange={event => update(field.key, field.type === "number" && event.target.value ? Number(event.target.value) : event.target.value)} />
        </label>;
      })}
    </div>;
    const node = admin ? (
      <section key={group.title} className={styles.detailGroup}><h3>{group.title}</h3>{fields}</section>
    ) : (
      <details key={group.title} className={styles.group} open={index === 0 ? true : undefined}>
        <summary>{group.title}</summary>{fields}
      </details>
    );

    return { section: detailSectionByGroup[group.title], node };
  });

  const socialLinks = <Repeated<RichContent["socialLinks"][number]> title="Social links" items={content.socialLinks} max={12}
    create={() => ({ platform: "LinkedIn", url: "" })} onChange={socialLinks => setContent({ ...content, socialLinks })}
    render={(item, change) => <>
      <SelectField label="Platform" value={item.platform} options={SOCIAL_PLATFORMS} onChange={platform => { if (platform) change({ platform: platform as typeof item.platform }); }} />
      <TextField label="Profile URL" type="url" value={item.url} onChange={url => change({ url })} />
    </>} />;
  const categories = <Repeated title="Product and service categories" items={content.categories} max={5}
    create={() => ({ categoryId: "", subcategoryId: "" })} onChange={categories => setContent({ ...content, categories })}
    render={(item, change) => <>
      <SelectField label="Category" options={catalog.categories} value={item.categoryId} onChange={categoryId => change({ categoryId, subcategoryId: "" })} />
      <SelectField label="Subcategory" options={catalog.subcategories.filter(option => option.category_id === item.categoryId)}
        value={item.subcategoryId} onChange={subcategoryId => change({ subcategoryId })} empty="All subcategories" />
    </>} />;
  const certificates = <Repeated<RichContent["certificates"][number]> title="Certification records" items={content.certificates} max={20}
    create={() => ({ name: "", bodyId: "", issuer: "", number: "", scope: "", issued: "", expires: "", proofUrl: "", documentId: "" })}
    onChange={certificates => setContent({ ...content, certificates })}
    render={(item, change) => <>
      <TextField label="Certificate name" value={item.name} onChange={name => change({ name })} />
      <SelectField label="Certification body" value={item.bodyId} options={catalog.bodies} onChange={bodyId => change({ bodyId })} />
      <TextField label="Other issuer" value={item.issuer} onChange={issuer => change({ issuer })} />
      <TextField label="Certificate number" value={item.number} onChange={number => change({ number })} />
      <SelectField label="Scope" options={CERTIFICATE_SCOPES} value={item.scope} onChange={scope => change({ scope: scope as typeof item.scope })} />
      <TextField label="Issue date" type="date" value={item.issued} onChange={issued => change({ issued })} />
      <TextField label="Expiry date" type="date" value={item.expires} onChange={expires => change({ expires })} />
      <TextField label="Public verification URL" type="url" value={item.proofUrl} onChange={proofUrl => change({ proofUrl })} />
      <SelectField label="Uploaded certificate document" value={item.documentId} options={assetChoices("credential")} onChange={documentId => change({ documentId })} />
    </>} />;
  const awards = <Repeated title="Awards and recognitions" items={content.awards} max={20}
    create={() => ({ name: "", issuer: "", year: "", proofUrl: "", imageId: "" })}
    onChange={awards => setContent({ ...content, awards })}
    render={(item, change) => <>
      <TextField label="Award name" value={item.name} onChange={name => change({ name })} />
      <TextField label="Issuing organization" value={item.issuer} onChange={issuer => change({ issuer })} />
      <TextField label="Year" value={item.year} onChange={year => change({ year })} />
      <TextField label="Proof URL" type="url" value={item.proofUrl} onChange={proofUrl => change({ proofUrl })} />
      <SelectField label="Uploaded award image" value={item.imageId} options={assetChoices("award")} onChange={imageId => change({ imageId })} />
    </>} />;
  const memberships = <Repeated title="Trade associations and memberships" items={content.memberships} max={20}
    create={() => ({ name: "", proofUrl: "" })} onChange={memberships => setContent({ ...content, memberships })}
    render={(item, change) => <>
      <TextField label="Association or membership" value={item.name} onChange={name => change({ name })} />
      <TextField label="Proof URL" type="url" value={item.proofUrl} onChange={proofUrl => change({ proofUrl })} />
    </>} />;

  const news = <NewsForm updates={content.news} images={assetChoices("gallery")} onChange={news => setContent({ ...content, news })} />;
  const groupsIn = (section: DetailSection) => groups.filter(group => group.section === section).map(group => group.node);
  const sections: Record<DetailSection, ReactNode> = {
    company: groupsIn("company"),
    people: <>{groupsIn("people")}{socialLinks}</>,
    products: <>{groupsIn("products")}{categories}</>,
    news,
    sustainability: <>
      {groupsIn("sustainability")}
      <section className={styles.detailGroup}>
        <h3>Claim verification</h3>
        <SelectField label="Sustainability claim verification status" value={content.claimStatus || ""} options={CLAIM_STATUSES} empty="Automatic from profile evidence"
          onChange={claimStatus => setContent({ ...content, claimStatus: (claimStatus || undefined) as RichContent["claimStatus"] })} />
      </section>
      {certificates}{awards}{memberships}
    </>,
  };

  return (
    <form noValidate onSubmit={submit}>
      <fieldset className={styles.stack} disabled={busy || !profile.editable}>
        {admin ? (
          <SectionLayout label="Profile detail sections" sections={detailSections} active={activeSection} onSelect={setActiveSection}>
            {({ id }) => sections[id]}
          </SectionLayout>
        ) : <>{groups.map(group => group.node)}{socialLinks}{categories}{certificates}{awards}{memberships}{news}</>}
        {admin && saveButton ? (
          <div className={styles.adminSaveBar}>
            <span role="status" data-dirty={dirty}>{busy ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}</span>
            {saveButton}
          </div>
        ) : saveButton}
      </fieldset>
    </form>
  );
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

function Preview({ item, type, dialog = false }: { item: EditorAd | EditorMedia; type: "asset" | "ad"; dialog?: boolean }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => () => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); }, [url]);
  async function preview() {
    setError("");
    setLoading(true);
    try {
      const session = await getValidSession();
      if (!session) throw new Error("Sign in again to preview this file.");
      const response = await fetch(`/api/rich-vendor-media/${type}/${item.id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("This file could not be opened.");
      setUrl(URL.createObjectURL(await response.blob()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview unavailable.");
    } finally {
      setLoading(false);
    }
  }
  const source = item.sourceUrl ? videoSource(item.sourceUrl) : undefined;
  if (item.sourceUrl && (!dialog || !source)) {
    return source ? <a href={source.url} target="_blank" rel="noreferrer">Open video</a> : null;
  }
  const mediaClass = dialog ? styles.adPreviewMedia : styles.preview;
  const media = !url ? null : item.mimeType?.startsWith("image/")
    ? <img className={mediaClass} src={url} alt={item.title} />
    : item.mimeType?.startsWith("video/")
      ? <video className={mediaClass} src={url} aria-label={item.title} controls playsInline />
      : <a href={url} target="_blank" rel="noreferrer">Open document</a>;

  if (dialog) {
    return <>
      <button className={styles.adAction} type="button" aria-label={`Preview ${item.title}`} onClick={() => {
        dialogRef.current?.showModal();
        setPreviewOpen(true);
        if (!source && !url && !loading) void preview();
      }}>Preview</button>
      <dialog ref={dialogRef} className={styles.adPreviewDialog} aria-labelledby={titleId}
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
        {media}
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

function MediaEditor({ profile, save, busy, admin }: { profile: EditorData; save: Save; busy: boolean; admin: boolean }) {
  const [activeSection, setActiveSection] = useState<AssetType>("pdf");
  const videoCount = profile.media.filter(item => item.purpose === "intro" || item.purpose === "video").length;
  const videoUsage = <p>Profile videos ({videoCount}/{PROFILE_VIDEO_LIMIT}), including the introduction video.</p>;
  const groups = Object.entries(MEDIA) as [MediaPurpose, (typeof MEDIA)[MediaPurpose]][];

  function renderGroup([purpose, config]: (typeof groups)[number]) {
    const items = profile.media.filter(item => item.purpose === purpose);
    const canAdd = items.length < config.limit && (config.type !== "video" || videoCount < PROFILE_VIDEO_LIMIT);
    const label = admin && purpose === "brochure" ? "Company brochure / catalogue" : config.label;

    return <details className={styles.group} key={purpose}>
      <summary>{label} ({items.length}/{config.limit})</summary>
      <div className={styles.stack}>
        {items.map(item => <div className={styles.item} key={item.id}>
          <strong>{item.title}</strong>
          <div className={styles.chips}>
            <Preview item={item} type="asset" />
            {profile.editable && <button type="button" className={styles.small} disabled={busy}
              onClick={() => { if (window.confirm(`Remove “${item.title}”?`)) void save({ action: "delete_media", id: item.id }); }}>Remove file</button>}
          </div>
        </div>)}
        {profile.editable && !canAdd && <p>Limit reached. Remove an item to add another.</p>}
        {profile.editable && canAdd && (
          <form onSubmit={async event => {
            event.preventDefault();
            const form = event.currentTarget;
            if (await save(new FormData(form))) form.reset();
          }}>
            <fieldset disabled={busy} className={styles.fields}>
              <input type="hidden" name="action" value="add_media" />
              <input type="hidden" name="purpose" value={purpose} />
              <label>Title<input name="title" required maxLength={120} /></label>
              <label>File (up to {ASSET_LIMIT_MB[config.type]} MB)<input type="file" name="file" accept={ASSET_MIME_TYPES[config.type].join(",")} required={config.type !== "video"} /></label>
              {config.type === "video" ? <label>Or a YouTube, Vimeo, MP4 or WebM URL<input type="url" name="sourceUrl" /></label> : <input type="hidden" name="sourceUrl" value="" />}
              <button type="submit" className={styles.primary}>{admin ? "Save media" : "Add media"}</button>
            </fieldset>
          </form>
        )}
      </div>
    </details>;
  }

  return admin ? (
    <SectionLayout label="Media sections" sections={mediaSections} active={activeSection} onSelect={setActiveSection}>
      {({ id }) => <>
        {id === "video" && videoUsage}
        {groups.filter(([, config]) => config.type === id).map(renderGroup)}
      </>}
    </SectionLayout>
  ) : <div className={styles.stack}>{videoUsage}{groups.map(renderGroup)}</div>;
}

function AdForm({ kind, ad, busy, save, onSaved }: { kind: AdKind; ad?: EditorAd; busy: boolean; save: Save; onSaved?: () => void }) {
  const assetType = kind === "banner" ? "image" : "video";
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
      <fieldset disabled={busy} className={styles.fields}>
        <input type="hidden" name="action" value="save_ad" />
        <input type="hidden" name="kind" value={kind} />
        {ad && <input type="hidden" name="id" value={ad.id} />}
        <label>Ad title<input name="title" required maxLength={120} defaultValue={ad?.title} /></label>
        <label>{ad ? "Replace file" : "File"} (up to {ASSET_LIMIT_MB[assetType]} MB)
          <input type="file" name="file" accept={ASSET_MIME_TYPES[assetType].join(",")} required={!ad && kind === "banner"} />
        </label>
        {kind === "video" ? <label>{ad ? "Replace with a video URL" : "Or a YouTube, Vimeo, MP4 or WebM URL"}<input type="url" name="sourceUrl" /></label>
          : <input type="hidden" name="sourceUrl" value="" />}
        <label>Destination URL<input type="url" name="linkUrl" defaultValue={ad?.linkUrl ?? ""} /></label>
        <label>Display order<input type="number" name="sortOrder" min={0} max={9999} required defaultValue={ad?.sortOrder ?? 0} /></label>
        <label className={styles.check}><input type="checkbox" name="enabled" value="true" defaultChecked={ad?.vendorEnabled ?? false} />Vendor switch on</label>
        <button className={styles.primary}>{ad ? "Save ad" : "Add ad"}</button>
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
  const Icon = ad.kind === "banner" ? Image : Video;

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
        <AdForm kind={ad.kind} ad={ad} busy={busy} save={save} onSaved={() => setEditing(false)} />
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

  return (
    <section className={styles.detailGroup}>
      <div className={styles.adsHeader}>
        <div>
          <h3>{title}</h3>
          <p className={styles.adOrder}>{count}/{AD_LIMITS[kind]} slots used</p>
        </div>
        {canAdd && <button type="button" className={styles.primary} aria-expanded={adding} aria-controls={formId}
          disabled={busy} onClick={() => setAdding(!adding)}>
          {!adding && <Plus size={16} aria-hidden="true" />}
          {adding ? "Close form" : kind === "banner" ? "Add banner ad" : "Add video ad"}
        </button>}
      </div>
      {canAdd && <div id={formId} className={styles.adFormPanel} hidden={!adding}>
        <AdForm kind={kind} busy={busy} save={save} onSaved={() => setAdding(false)} />
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

export default function RichProfileEditor({ adminVendorId }: { adminVendorId?: string }) {
  const admin = Boolean(adminVendorId);
  const url = adminVendorId ? `/api/admin/vendors/${encodeURIComponent(adminVendorId)}/rich-profile` : "/api/vendor/rich-profile";
  const editorId = useId();
  const [activeSection, setActiveSection] = useState<EditorSection>("details");
  const [data, setData] = useState<ApiData | null>(null);
  const [content, setContent] = useState<RichContent | null>(null);
  const [revision, setRevision] = useState(0);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    callEditor<ApiData>(url).then(next => {
      if (!current) return;
      setData(next);
      setContent(next.profile.content);
      setRevision(next.profile.revision);
      setFailure("");
    }).catch(error => { if (current) setFailure(error.message); });
    return () => { current = false; };
  }, [url, reload]);

  const save: Save = async (input, refreshContent) => {
    setBusy(true);
    setFailure("");
    setNotice("");
    try {
      await callEditor(url, input);
      setNotice("Changes saved.");
      try {
        const next = await callEditor<ApiData>(url);
        setData(next);
        if (refreshContent) {
          setContent(next.profile.content);
          setRevision(next.profile.revision);
        } else if (!(input instanceof FormData) && input.action === "delete_media" && content) {
          setContent({
            ...content,
            certificates: content.certificates.map(item => item.documentId === input.id ? { ...item, documentId: "" } : item),
            awards: content.awards.map(item => item.imageId === input.id ? { ...item, imageId: "" } : item),
            news: content.news.map(item => item.imageId === input.id ? { ...item, imageId: "" } : item),
          });
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

  const editorClass = admin ? `${styles.editor} ${styles.adminEditor}` : styles.editor;
  if (!data || !content) return <section className={editorClass}>
    <h2>Rich Profile</h2>
    {failure ? <><p role="alert">{failure}</p><button className={styles.small} onClick={() => setReload(count => count + 1)}>Retry</button></> : <p>Loading Rich Profile…</p>}
  </section>;

  const { profile, catalog } = data;
  const editorContent: Record<EditorSection, ReactNode> = {
    details: <ContentForm content={content} setContent={setContent} profile={profile} catalog={catalog} admin={admin} busy={busy} save={save} revision={revision} />,
    media: <MediaEditor profile={profile} admin={admin} busy={busy} save={save} />,
    ads: <AdEditor profile={profile} admin={admin} busy={busy} save={save} />,
  };
  const status = profile.active ? (profile.approved ? "Rich Profile live" : "Rich Profile enabled") : "Basic Profile selected";
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
    <section className={editorClass} aria-labelledby={`${editorId}-title`}>
      <div className={admin ? `${styles.heading} ${styles.adminHeading}` : styles.heading}>
        <div>
          <div className={styles.headingTitle}>
            <h2 id={`${editorId}-title`}>Rich Profile</h2>
            {admin && <span className={styles.profileStatus} data-live={profile.active && profile.approved}>{status}</span>}
          </div>
          {admin ? (
            !profile.approved ? <p>The public vendor page becomes available after approval.</p>
              : !profile.active && <p>Activate Rich Profile to publish the enhanced vendor page.</p>
          ) : (
            <p>{profile.active ? profile.approved ? "Active on the public vendor page." : "Enabled. The vendor page appears after approval."
              : "Your Rich Profile is inactive. Saved details are read-only."}</p>
          )}
        </div>
        <div className={styles.chips}>
          {profile.approved && <Link className={admin ? styles.adminPreview : undefined} href={profile.href} prefetch={false} rel="noreferrer" target="_blank">
            View public profile {admin && <ArrowUpRight size={15} aria-hidden="true" />}
          </Link>}
          {admin && <button className={profile.active ? styles.small : styles.primary} type="button" disabled={busy}
            onClick={() => void save({ action: "activate", active: !profile.active })}>{profile.active ? "Switch to Basic Profile" : "Activate Rich Profile"}</button>}
        </div>
      </div>
      {(notice || failure) && <div className={styles.feedback} role={failure ? "alert" : "status"}>
        <span>{failure || notice}</span>
        {failure && <button className={styles.small} type="button" disabled={busy} onClick={() => setReload(count => count + 1)}>Reload editor</button>}
      </div>}
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
