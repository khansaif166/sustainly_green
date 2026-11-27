"use client";

import { useId, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { RICH_FIELDS } from "@/lib/richVendorProfile";
import styles from "./editor.module.css";

export type OptionKey = "supplies" | "offeringTypes" | "productionModels" | "procurementCategories" | "supplierRequirements" | "focusAreas" | "preferredBuyers";

export function OptionChoices({ field, title, help, selected, onChange, labelledBy }: {
  field: OptionKey; title: string; help: string; selected: string[]; onChange: (values: string[]) => void; labelledBy?: string;
}) {
  const id = useId();
  const definition = RICH_FIELDS.flatMap(group => [...group.fields]).find(item => item.key === field);
  const choices: readonly string[] = definition && "options" in definition ? definition.options : [];
  const options = [...choices, ...selected.filter(value => !choices.includes(value))];
  return <fieldset className={styles.optionGroup} aria-labelledby={labelledBy} aria-describedby={`${id}-help`}>
    {!labelledBy && <legend>{title}<span className={styles.selectionCount}>{selected.length} selected</span></legend>}
    <p id={`${id}-help`} className={styles.companyHelp}>{help}</p>
    <div className={styles.optionGrid}>
      {options.map(option => <label key={option} className={styles.optionChoice}>
        <input type="checkbox" checked={selected.includes(option)} disabled={!selected.includes(option) && selected.length >= 20}
          onChange={event => {
            if (event.target.checked && !selected.includes(option) && selected.length < 20) onChange([...selected, option]);
            else if (!event.target.checked) onChange(selected.filter(value => value !== option));
          }} />
        <span>{option}{!choices.includes(option) && <small>Previously selected</small>}</span>
      </label>)}
    </div>
  </fieldset>;
}

export function CollapsibleOptionChoices({ field, title, help, selected, onChange, initiallyOpen }: {
  field: OptionKey; title: string; help: string;
  selected: string[]; onChange: (values: string[]) => void; initiallyOpen?: boolean;
}) {
  const titleId = useId();
  return (
    <details className={styles.optionDisclosure} open={initiallyOpen || undefined}>
      <summary>
        <strong id={titleId}>{title}</strong>
        <span className={styles.selectionCount} data-selected={selected.length > 0}>{selected.length} selected</span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className={styles.optionDisclosureBody}>
        <OptionChoices field={field} title={title} help={help} selected={selected} onChange={onChange} labelledBy={titleId} />
      </div>
    </details>
  );
}

export function SourcingTags({ title, help, placeholder, selected, onChange }: {
  title: string; help: string; placeholder: string; selected: string[]; onChange: (values: string[]) => void;
}) {
  const id = useId();
  const [entry, setEntry] = useState("");
  const value = entry.trim();
  const duplicate = selected.some(item => item.toLowerCase() === value.toLowerCase());
  const canAdd = Boolean(value) && value.length <= 120 && !duplicate && selected.length < 20;
  function add() {
    if (!canAdd) return;
    onChange([...selected, value]);
    setEntry("");
  }
  return <div className={styles.sourcingTags}>
    <label htmlFor={`${id}-entry`}>{title}<span className={styles.selectionCount}>{selected.length}/20</span></label>
    <p id={`${id}-help`} className={styles.companyHelp}>{help} Press Enter or Add after each item.</p>
    <div className={styles.stack}>
      <div className={styles.tagEntry}>
        <input id={`${id}-entry`} value={entry} maxLength={120} placeholder={placeholder} aria-describedby={`${id}-help`}
          disabled={selected.length >= 20} onChange={event => setEntry(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); add(); } }} />
        <button type="button" className={styles.small} onClick={add} disabled={!canAdd}><Plus size={15} aria-hidden="true" />Add</button>
      </div>
      {duplicate && value && <p className={styles.companyHelp} role="status">This item is already added.</p>}
      {selected.length > 0 && <ul className={styles.selectedTags} aria-label={`Selected ${title.toLowerCase()}`} role="list">
        {selected.map(item => <li key={item}><span>{item}</span><button type="button" aria-label={`Remove ${item}`}
          onClick={() => onChange(selected.filter(value => value !== item))}><X size={14} aria-hidden="true" /></button></li>)}
      </ul>}
      {selected.length >= 20 && <p className={styles.companyHelp}>Limit reached. Remove an item to add another.</p>}
    </div>
  </div>;
}
