"use client";

import { useEffect, useId, useRef } from "react";
import { Layers3, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { CatalogOptions, RichContent, RichFieldKey } from "@/lib/richVendorProfile";
import styles from "./editor.module.css";
import { CollapsibleOptionChoices, SourcingTags, type OptionKey } from "./ProfileSelectionFields";

type Category = RichContent["categories"][number];

function ProductCategories({ items, catalog, onChange }: { items: Category[]; catalog: CatalogOptions; onChange: (items: Category[]) => void }) {
  const id = useId();
  const inputs = useRef<(HTMLSelectElement | null)[]>([]);
  const addButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    if (items.length) inputs.current[index]?.focus();
    else addButton.current?.focus();
  }, [items.length]);

  return <section className={styles.companySection} aria-labelledby={`${id}-title`}>
    <div className={styles.productSectionHeader}>
      <div className={styles.companySectionHeader}><div>
        <h4 id={`${id}-title`}><Layers3 size={17} aria-hidden="true" />Product and service categories<span className={styles.selectionCount}>{items.length}/5</span></h4>
        <p>Choose categories buyers can use to find your products and services.</p>
      </div></div>
      <button ref={addButton} type="button" className={styles.small} disabled={items.length >= 5 || !catalog.categories.length}
        onClick={() => {
          if (items.length >= 5 || !catalog.categories.length) return;
          pendingFocus.current = items.length;
          onChange([...items, { categoryId: "", subcategoryId: "" }]);
        }}><Plus size={16} aria-hidden="true" />Add category</button>
    </div>
    {items.length ? <ul className={styles.socialLinkList} role="list">
      {items.map((item, index) => {
        const subcategories = catalog.subcategories.filter(option => option.category_id === item.categoryId);
        return <li key={index} className={styles.categoryRow}>
          <label htmlFor={`${id}-category-${index}`}>Category
            <select ref={node => { inputs.current[index] = node; }} id={`${id}-category-${index}`} required value={item.categoryId}
              onChange={event => onChange(items.map((row, at) => at === index ? { categoryId: event.target.value, subcategoryId: "" } : row))}>
              <option value="">Choose a category</option>
              {item.categoryId && !catalog.categories.some(option => option.id === item.categoryId) && <option value={item.categoryId}>Previously selected (unavailable)</option>}
              {catalog.categories.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label>
          <label htmlFor={`${id}-subcategory-${index}`}><span>Subcategory <span className={styles.optionalLabel}>(optional)</span></span>
            <select id={`${id}-subcategory-${index}`} value={item.subcategoryId} disabled={!item.categoryId}
              onChange={event => onChange(items.map((row, at) => at === index ? { ...row, subcategoryId: event.target.value } : row))}>
              <option value="">{item.categoryId ? "All subcategories" : "Choose a category first"}</option>
              {item.subcategoryId && !subcategories.some(option => option.id === item.subcategoryId) && <option value={item.subcategoryId}>Previously selected (unavailable)</option>}
              {subcategories.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label>
          <button type="button" className={styles.socialRemove} aria-label={`Remove category ${index + 1}`} onClick={() => {
            pendingFocus.current = Math.max(0, Math.min(index, items.length - 2));
            onChange(items.filter((_, at) => at !== index));
          }}><Trash2 size={16} aria-hidden="true" />Remove</button>
        </li>;
      })}
    </ul> : <p className={styles.selectionEmpty}>{catalog.categories.length ? "No categories selected yet." : "The category catalog is currently empty."}</p>}
  </section>;
}

export default function ProductsSourcingFields({ fields, categories, catalog, onChange, onCategoriesChange }: {
  fields: RichContent["fields"]; categories: Category[]; catalog: CatalogOptions;
  onChange: (key: RichFieldKey, value: string[] | boolean) => void;
  onCategoriesChange: (items: Category[]) => void;
}) {
  const id = useId();
  const selected = (key: RichFieldKey) => Array.isArray(fields[key]) ? fields[key] as string[] : [];
  const choices = (field: OptionKey, title: string, help: string, initiallyOpen = false) =>
    <CollapsibleOptionChoices field={field} title={title} help={help} selected={selected(field)} initiallyOpen={initiallyOpen}
      onChange={values => onChange(field, values)} />;
  const sourcingVisible = fields.publishProcurement === true;
  return <div className={`${styles.companyForm} ${styles.productsSourcingForm}`}>
    <div className={styles.companyProfileHeader}>
      <span className={styles.adminProfileIcon}><Package size={21} aria-hidden="true" /></span>
      <div className={styles.companyIntro}>
        <h3>Products and sourcing</h3>
        <p>Manage what the company sells and what it needs from suppliers.</p>
      </div>
    </div>
    <section className={styles.companySection} aria-labelledby={`${id}-offers`}>
      <div className={styles.companySectionHeader}><div><h4 id={`${id}-offers`}><Package size={17} aria-hidden="true" />What you offer</h4></div></div>
      <div className={styles.productOptionList}>
        {choices("supplies", "Products and services you sell", "Select all that apply.", true)}
        {choices("offeringTypes", "Offering types", "Choose the kinds of products or services buyers can source from you.")}
        {choices("productionModels", "Supply and manufacturing models", "Choose how you manufacture, fulfil, or supply orders.")}
      </div>
    </section>
    <ProductCategories items={categories} catalog={catalog} onChange={onCategoriesChange} />
    <section className={`${styles.companySection} ${styles.procurementSection}`} aria-labelledby={`${id}-procurement`}>
      <div className={styles.companySectionHeader}><div><h4 id={`${id}-procurement`}><ShoppingBag size={17} aria-hidden="true" />Sourcing preferences</h4></div></div>
      <div className={`${styles.companyGrid} ${styles.procurementControls}`}>
        <label className={styles.publishControl}>
          <strong>Looking for raw materials or ingredients</strong>
          <input type="checkbox" role="switch" checked={fields.seekingMaterials === true}
            onChange={event => onChange("seekingMaterials", event.target.checked)} />
        </label>
        <label className={styles.publishControl}>
          <span><strong>Public sourcing visibility</strong>
            <span aria-hidden="true">{sourcingVisible ? "Visible after saving" : "Hidden from the public profile"}</span>
          </span>
          <input type="checkbox" role="switch" checked={sourcingVisible}
            aria-label="Show sourcing preferences on public profile"
            onChange={event => onChange("publishProcurement", event.target.checked)} />
        </label>
      </div>
      {choices("procurementCategories", "Procurement needs", "Choose the products and services you need to buy.")}
      <div className={`${styles.companyGrid} ${styles.pairedSourcingTags}`}>
        <SourcingTags title="Materials or ingredients needed" help="Add specific materials you’re looking for." placeholder="e.g. Recycled paper"
          selected={selected("materialsNeeded")} onChange={values => onChange("materialsNeeded", values)} />
        <SourcingTags title="Preferred supplier locations" help="Add countries, regions, or cities." placeholder="e.g. India"
          selected={selected("supplierLocations")} onChange={values => onChange("supplierLocations", values)} />
      </div>
      {choices("supplierRequirements", "Supplier requirements", "Select the standards or qualities you look for in suppliers.")}
    </section>
  </div>;
}
