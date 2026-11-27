"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Newspaper, Plus, Trash2 } from "lucide-react";
import { NEWS_BODY_LIMIT, NEWS_HEADLINE_LIMIT, type RichNewsUpdate } from "@/lib/richVendorProfile";
import styles from "./editor.module.css";
import NewsImagePicker from "./NewsImagePicker";

function localDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function displayDate(value: string) {
  const date = value ? new Date(`${value}T00:00:00Z`) : null;
  return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(date) : "Date not set";
}

export default function NewsEditor({ updates, onChange, onImageUpload, active = true }: {
  updates: RichNewsUpdate[]; onChange: (updates: RichNewsUpdate[]) => void;
  onImageUpload: (updateId: string, file: File) => Promise<string>;
  active?: boolean;
}) {
  const id = useId();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const details = useRef(new Map<string, HTMLDetailsElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<{ id: string | null; headline: boolean } | null>(null);

  if (!active && expandedId !== null) setExpandedId(null);

  useEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = null;
    if (!active || !pending) return;
    if (!pending.id) { addButton.current?.focus(); return; }
    details.current.get(pending.id)?.querySelector<HTMLElement>(pending.headline ? "input[data-news-headline]" : "summary")?.focus();
  }, [active, updates.length]);

  function addUpdate() {
    const nextId = crypto.randomUUID();
    pendingFocus.current = { id: nextId, headline: true };
    setExpandedId(nextId);
    onChange([...updates, { id: nextId, headline: "", body: "", date: localDate(), imageId: "", sourceUrl: "", published: false }]);
  }

  function update(itemId: string, changes: Partial<RichNewsUpdate>) {
    onChange(updates.map(item => item.id === itemId ? { ...item, ...changes } : item));
  }

  return <section className={`${styles.detailGroup} ${styles.newsEditor}`} aria-labelledby={`${id}-title`}>
    <div className={styles.companyForm}>
      <div className={styles.socialEditorHeader}>
        <div className={styles.companyIntro}><h3 id={`${id}-title`}><Newspaper size={18} aria-hidden="true" />News and updates<span className={styles.selectionCount}>{updates.length}</span></h3>
          <p>Share company news, product launches, and milestones. Updates marked public go live when you save profile details.</p></div>
        <button ref={addButton} type="button" className={styles.small} onClick={addUpdate}><Plus size={16} aria-hidden="true" />Add update</button>
      </div>
      {updates.length ? <div className={styles.newsEditorList}>
        {updates.map((item, index) => <details key={item.id} ref={node => { if (node) details.current.set(item.id, node); else details.current.delete(item.id); }}
          className={`${styles.group} ${styles.newsEditorCard}`} open={expandedId === item.id}
          onToggle={event => {
            if (!active) return;
            if (event.currentTarget.open && expandedId !== item.id) setExpandedId(item.id);
            else if (!event.currentTarget.open && expandedId === item.id) setExpandedId(null);
          }}>
          <summary><span className={styles.newsCardSummary}><span className={styles.newsCardTitle}>{item.headline || "Untitled update"}</span>
            <span className={styles.newsCardMeta}><span className={styles.profileStatus} data-live={item.published}>{item.published ? "Public" : "Draft"}</span>
              <time dateTime={item.date || undefined}>{displayDate(item.date)}</time></span></span></summary>
          <div className={styles.newsEditorBody}>
            <div className={styles.newsTopFields}>
              <label>Headline<input data-news-headline="" value={item.headline} maxLength={NEWS_HEADLINE_LIMIT} required={item.published}
                placeholder="Give your update a clear, short title" onChange={event => update(item.id, { headline: event.target.value })} />
                <span className={styles.fieldCounter}>{item.headline.length}/{NEWS_HEADLINE_LIMIT}</span></label>
              <label>Display date<input type="date" value={item.date} required={item.published} onChange={event => update(item.id, { date: event.target.value })} /></label>
            </div>
            <label>Update text<textarea rows={6} maxLength={NEWS_BODY_LIMIT} required={item.published} value={item.body}
              placeholder="Tell buyers what’s new and why it matters." onChange={event => update(item.id, { body: event.target.value })} />
              <span className={styles.fieldCounter}>{item.body.length}/{NEWS_BODY_LIMIT}</span></label>
            <div className={styles.companyGrid}>
              <NewsImagePicker imageId={item.imageId} onUpload={file => onImageUpload(item.id, file)} onRemove={() => update(item.id, { imageId: "" })} />
              <label>Source link<input type="url" maxLength={2048} value={item.sourceUrl} placeholder="https://… (optional)"
                onChange={event => update(item.id, { sourceUrl: event.target.value })} /></label>
            </div>
            <label className={styles.publishControl}><input type="checkbox" role="switch" checked={item.published} aria-checked={item.published}
              onChange={event => update(item.id, { published: event.target.checked })} />
              <span><strong>Show this update on public profile</strong><span>To publish, add a headline, display date, and update text, then save profile details.</span></span></label>
            <div className={styles.newsEditorFooter}><span className={styles.companyHelp}>{item.published ? "Marked public. Save profile details to apply changes." : "Draft — visible only in this editor."}</span>
              <button type="button" className={`${styles.socialRemove} ${styles.newsRemove}`} aria-label={`Remove update ${index + 1}: ${item.headline || "Untitled update"}`}
                onClick={() => {
                  const next = updates[index + 1] || updates[index - 1];
                  pendingFocus.current = { id: next?.id || null, headline: false };
                  if (expandedId === item.id) setExpandedId(next?.id || null);
                  onChange(updates.filter(update => update.id !== item.id));
                }}><Trash2 size={16} aria-hidden="true" />Remove update</button></div>
          </div>
        </details>)}
      </div> : <div className={styles.socialEmpty}><Newspaper size={24} aria-hidden="true" /><div><strong>No updates yet</strong><p>Add your first update. You can save it as a draft and publish it when it’s ready.</p></div></div>}
    </div>
  </section>;
}
