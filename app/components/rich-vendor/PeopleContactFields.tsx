"use client";

import { useEffect, useId, useRef } from "react";
import { Globe, Link2, Phone, Plus, Trash2, UserRound, Users } from "lucide-react";
import { SOCIAL_PLATFORMS, type RichContent, type RichFieldKey } from "@/lib/richVendorProfile";
import styles from "./editor.module.css";

export default function PeopleContactFields({ fields, onChange }: {
  fields: RichContent["fields"];
  onChange: (key: RichFieldKey, value: string | boolean) => void;
}) {
  const id = useId();
  const person = (kind: "director" | "contact") => {
    const director = kind === "director";
    const name = director ? "directorName" : "contactName";
    const role = director ? "directorRole" : "contactRole";
    const publish = director ? "publishDirector" : "publishContact";
    const title = director ? "Director" : "Public contact person";
    const Icon = director ? UserRound : Users;
    return <section className={styles.personEditorCard} aria-labelledby={`${id}-${kind}`}>
      <div className={styles.companySectionHeader}><div>
        <h4 id={`${id}-${kind}`}><Icon size={18} aria-hidden="true" />{title}</h4>
        <p>{director ? "Add a member of the company’s leadership." : "Choose who buyers can speak to about enquiries."}</p>
      </div></div>
      <div className={styles.personFields}>
        <label>Full name<input value={String(fields[name] ?? "")} maxLength={160}
          placeholder={director ? "Director’s full name" : "Contact person’s full name"}
          onChange={event => onChange(name, event.target.value)} /></label>
        <label>Role or title<input value={String(fields[role] ?? "")} maxLength={160}
          placeholder={director ? "e.g. Managing Director" : "e.g. Sales Manager"}
          onChange={event => onChange(role, event.target.value)} /></label>
      </div>
      <label className={styles.publishControl}>
        <input type="checkbox" role="switch" checked={fields[publish] === true} aria-checked={fields[publish] === true}
          onChange={event => onChange(publish, event.target.checked)} />
        <span><strong>Show {director ? "director" : "contact person"} on public profile</strong>
          <span>Their name and uploaded photo will be visible to buyers.</span></span>
      </label>
    </section>;
  };

  return <div className={styles.companyForm}>
    <div className={styles.companyIntro}>
      <h3>People and contact</h3>
      <p>Add the people behind your business and the best ways for buyers to reach you.</p>
    </div>
    <div className={styles.peopleCards}>{person("director")}{person("contact")}</div>
    <p className={styles.companyHelp}>Director and contact person photos can be added in the Media section.</p>
    <section className={styles.companySection} aria-labelledby={`${id}-methods`}>
      <div className={styles.companySectionHeader}><div>
        <h4 id={`${id}-methods`}><Phone size={17} aria-hidden="true" />Company contact details</h4>
        <p>These contact methods are displayed on your public business profile for buyer enquiries.</p>
      </div></div>
      <div className={styles.companyGrid}>
        <label>Company phone<input type="tel" value={String(fields.phone ?? "")} maxLength={160}
          placeholder="e.g. +91 98765 43210" aria-describedby={`${id}-phone-help`}
          onChange={event => onChange("phone", event.target.value)} /></label>
        <label>WhatsApp number<input type="tel" value={String(fields.whatsapp ?? "")} maxLength={160}
          placeholder="e.g. +91 98765 43210" aria-describedby={`${id}-phone-help`}
          onChange={event => onChange("whatsapp", event.target.value)} /></label>
        <label className={styles.companyWide}>Company email<input type="email" value={String(fields.email ?? "")} maxLength={160}
          placeholder="e.g. enquiries@company.com" onChange={event => onChange("email", event.target.value)} /></label>
      </div>
      <p id={`${id}-phone-help`} className={styles.companyHelp}>Include the country code, such as +91, so international buyers can reach you.</p>
    </section>
  </div>;
}

type SocialLink = RichContent["socialLinks"][number];

export function SocialLinksEditor({ items, onChange }: { items: SocialLink[]; onChange: (items: SocialLink[]) => void }) {
  const id = useId();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const addButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    if (items.length) inputs.current[index]?.focus();
    else addButton.current?.focus();
  }, [items.length]);

  function update(index: number, changes: Partial<SocialLink>) {
    onChange(items.map((item, at) => at === index ? { ...item, ...changes } : item));
  }

  return <section className={styles.detailGroup} aria-labelledby={`${id}-title`}>
    <div className={styles.companyForm}>
      <div className={styles.socialEditorHeader}>
        <div className={styles.companyIntro}>
          <h3 id={`${id}-title`}><Globe size={18} aria-hidden="true" />Social links
            <span className={styles.socialCount} aria-label={`${items.length} of 12 links`}>{items.length}/12</span></h3>
          <p>Add official profiles using full links starting with https://. Changes publish when you save profile details.</p>
        </div>
        <button ref={addButton} type="button" className={styles.small} disabled={items.length >= 12}
          onClick={() => {
            if (items.length >= 12) return;
            pendingFocus.current = items.length;
            onChange([...items, { platform: "LinkedIn", url: "" }]);
          }}><Plus size={16} aria-hidden="true" />Add link</button>
      </div>
      {items.length ? <ul className={styles.socialLinkList} role="list">
        {items.map((item, index) => <li key={index} className={styles.socialLinkRow}>
          <label htmlFor={`${id}-platform-${index}`}>Platform
            <select id={`${id}-platform-${index}`} value={item.platform}
              onChange={event => update(index, { platform: event.target.value as SocialLink["platform"] })}>
              {SOCIAL_PLATFORMS.map(platform => <option key={platform} value={platform}>{platform === "Other" ? "Other website" : platform}</option>)}
            </select>
          </label>
          <label htmlFor={`${id}-url-${index}`}>Profile link
            <input ref={node => { inputs.current[index] = node; }} id={`${id}-url-${index}`} type="url" required maxLength={2048}
              value={item.url} placeholder="https://…" spellCheck={false} autoCapitalize="none"
              onChange={event => update(index, { url: event.target.value })} />
          </label>
          <button type="button" className={styles.socialRemove} aria-label={`Remove ${item.platform} link ${index + 1}`}
            onClick={() => {
              pendingFocus.current = Math.max(0, Math.min(index, items.length - 2));
              onChange(items.filter((_, at) => at !== index));
            }}><Trash2 size={16} aria-hidden="true" />Remove</button>
        </li>)}
      </ul> : <div className={styles.socialEmpty}>
        <Link2 size={22} aria-hidden="true" /><div><strong>No social links yet</strong><p>Add a social profile or website to help buyers learn more about your business.</p></div>
      </div>}
      {items.length >= 12 && <p className={styles.companyHelp}>You’ve added the maximum of 12 links. Remove a link to add another.</p>}
    </div>
  </section>;
}
