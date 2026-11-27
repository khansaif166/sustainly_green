"use client";

import { useId, useState } from "react";
import { Leaf, ShieldCheck, Users, X } from "lucide-react";
import { CLAIM_STATUSES, RICH_FIELDS, type RichContent, type RichFieldKey } from "@/lib/richVendorProfile";
import { CollapsibleOptionChoices, SourcingTags } from "./ProfileSelectionFields";
import styles from "./editor.module.css";

function IndustryPicker({ selected, onChange }: { selected: string[]; onChange: (industries: string[]) => void }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const definition = RICH_FIELDS[3].fields.find(field => field.key === "preferredIndustries")!;
  const options = definition.options.filter(option => !selected.includes(option) && option.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className={styles.sourcingTags}>
    <div className={styles.selectionLabel}>Preferred buyer industries<span className={styles.selectionCount}>{selected.length}/5</span></div>
    <p id={`${id}-help`} className={styles.companyHelp}>Choose up to five industries. Search to narrow the available options.</p>
    <div className={styles.companyGrid}>
      <label className={styles.searchField}>Search industries<input type="search" placeholder="Search by industry name" value={query}
        disabled={selected.length >= 5} onChange={event => setQuery(event.target.value)}
        onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} /></label>
      <label>Choose an industry<select id={`${id}-choose`} value="" disabled={selected.length >= 5} aria-describedby={`${id}-help`}
        onChange={event => {
          const value = event.target.value;
          if (!value || selected.includes(value) || selected.length >= 5) return;
          onChange([...selected, value]);
          setQuery("");
        }}>
        <option value="">{selected.length >= 5 ? "Five industries selected" : "Select an industry"}</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select></label>
    </div>
    {query.trim() && !options.length && selected.length < 5 && <p className={styles.companyHelp} role="status">No matching industries. Try a different search.</p>}
    {selected.length > 0 && <ul className={styles.selectedTags} role="list" aria-label="Selected buyer industries">
      {selected.map(industry => <li key={industry}><span>{industry}</span><button type="button" aria-label={`Remove ${industry}`}
        onClick={() => onChange(selected.filter(item => item !== industry))}><X size={14} aria-hidden="true" /></button></li>)}
    </ul>}
  </div>;
}

export default function SustainabilityFields({ fields, onChange, claimStatus, onClaimStatusChange }: {
  fields: RichContent["fields"]; onChange: (key: RichFieldKey, value: string[]) => void;
  claimStatus: RichContent["claimStatus"]; onClaimStatusChange?: (status: RichContent["claimStatus"]) => void;
}) {
  const id = useId();
  const selected = (key: RichFieldKey) => Array.isArray(fields[key]) ? fields[key] as string[] : [];
  return <div className={`${styles.companyForm} ${styles.sustainabilityForm}`}>
    <div className={styles.companyProfileHeader}>
      <span className={styles.adminProfileIcon}><Leaf size={21} aria-hidden="true" /></span>
      <div className={styles.companyIntro}>
        <h3>Sustainability</h3>
        <p>Manage the company’s sustainability practices and buyer preferences.</p>
      </div>
    </div>
    <section className={styles.companySection} aria-labelledby={`${id}-focus`}>
      <h4 id={`${id}-focus`}><Leaf size={17} aria-hidden="true" />Sustainability focus</h4>
      <CollapsibleOptionChoices field="focusAreas" title="Focus areas" help="Select the practices that apply to the business." initiallyOpen
        selected={selected("focusAreas")} onChange={values => onChange("focusAreas", values)} />
    </section>
    {onClaimStatusChange && <section className={`${styles.companySection} ${styles.sustainabilityClaim}`} aria-labelledby={`${id}-claim`}>
      <div className={styles.companySectionHeader}><div>
        <h4 id={`${id}-claim`}><ShieldCheck size={17} aria-hidden="true" />Claim verification</h4>
        <p id={`${id}-claim-help`}>Choose the status shown on the public profile.</p>
      </div></div>
      <label>Sustainability claim status
        <select value={claimStatus || ""} aria-describedby={`${id}-claim-help`}
          onChange={event => onClaimStatusChange((event.target.value || undefined) as RichContent["claimStatus"])}>
          <option value="">Automatic</option>
          {CLAIM_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
    </section>}
    <section className={styles.companySection} aria-labelledby={`${id}-buyers`}>
      <h4 id={`${id}-buyers`}><Users size={17} aria-hidden="true" />Buyer preferences</h4>
      <CollapsibleOptionChoices field="preferredBuyers" title="Preferred buyer types" help="Select the kinds of customers the company works with."
        selected={selected("preferredBuyers")} onChange={values => onChange("preferredBuyers", values)} />
      <div className={styles.sustainabilityPreference}>
        <IndustryPicker selected={selected("preferredIndustries")} onChange={values => onChange("preferredIndustries", values)} />
      </div>
      <div className={styles.sustainabilityPreference}>
        <SourcingTags title="Preferred buyer locations" help="Add the countries, regions, or cities the company serves." placeholder="e.g. India or Europe"
          selected={selected("preferredGeography")} onChange={values => onChange("preferredGeography", values)} />
      </div>
    </section>
  </div>;
}
