"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, List, Plus, Trash2 } from "lucide-react";
import { MAX_PRODUCT_SPECIFICATIONS, MAX_SPECIFICATION_NAME_LENGTH, MAX_SPECIFICATION_VALUE_LENGTH } from "@/lib/productSpecifications";
import type { ProductSpecificationsController } from "./useProductSpecifications";
import styles from "./productSpecifications.module.css";

export default function ProductSpecificationsEditor({ controller, disabled = false }: {
  controller: ProductSpecificationsController;
  disabled?: boolean;
}) {
  const headingId = useId();
  return <section className={styles.editor} aria-labelledby={headingId}>
    <div className={styles.heading}>
      <div><h2 id={headingId}><List size={18} aria-hidden="true" />Product specifications <span>(optional)</span></h2>
        <p>Add details specific to this listing, such as Material → Bamboo or Capacity → 500 ml. Include units in the value.</p></div>
      <span className={styles.count}>{controller.rows.length}/{MAX_PRODUCT_SPECIFICATIONS}</span>
    </div>
    {controller.rows.length === 0 && <p className={styles.empty}>No specifications added. Use Add specification to create a custom field.</p>}
    <div className={styles.rows}>
      {controller.rows.map((row, index) => {
        const rowIssues = controller.issues.filter(issue => issue.index === index);
        const errorId = `${headingId}-${row.id}-error`;
        const nameLabelId = `${headingId}-${row.id}-name-label`, valueLabelId = `${headingId}-${row.id}-value-label`;
        return <div className={styles.row} key={row.id}>
          <div className={styles.fields}>
            <label><span id={nameLabelId}>Field name {index + 1}</span><input aria-labelledby={nameLabelId} value={row.name} maxLength={MAX_SPECIFICATION_NAME_LENGTH} placeholder="e.g. Material" disabled={disabled}
              aria-invalid={rowIssues.some(issue => issue.field === "name" || issue.field === "specifications") || undefined} aria-describedby={rowIssues.length ? errorId : undefined}
              onChange={event => controller.update(row.id, "name", event.target.value)} /></label>
            <label><span id={valueLabelId}>Value {index + 1}</span><textarea aria-labelledby={valueLabelId} value={row.value} maxLength={MAX_SPECIFICATION_VALUE_LENGTH} placeholder="e.g. Bamboo" rows={2} disabled={disabled}
              aria-invalid={rowIssues.some(issue => issue.field === "value" || issue.field === "specifications") || undefined} aria-describedby={rowIssues.length ? errorId : undefined}
              onChange={event => controller.update(row.id, "value", event.target.value)} /></label>
          </div>
          <div className={styles.actions}>
            <button type="button" aria-label={`Move specification ${index + 1} up`} title="Move up" disabled={disabled || index === 0} onClick={() => controller.move(row.id, -1)}><ArrowUp size={16} aria-hidden="true" /></button>
            <button type="button" aria-label={`Move specification ${index + 1} down`} title="Move down" disabled={disabled || index === controller.rows.length - 1} onClick={() => controller.move(row.id, 1)}><ArrowDown size={16} aria-hidden="true" /></button>
            <button type="button" className={styles.remove} aria-label={`Remove specification ${index + 1}`} title="Remove specification" disabled={disabled} onClick={() => controller.remove(row.id)}><Trash2 size={16} aria-hidden="true" /></button>
          </div>
          {rowIssues.length > 0 && <div id={errorId} className={styles.error} role="alert">{rowIssues.map((issue, issueIndex) => <p key={issueIndex}>{issue.message}</p>)}</div>}
        </div>;
      })}
    </div>
    {controller.issues.filter(issue => issue.index < 0).map((issue, index) => <p className={styles.error} role="alert" key={index}>{issue.message}</p>)}
    <button type="button" className={styles.add} disabled={disabled || controller.rows.length >= MAX_PRODUCT_SPECIFICATIONS} onClick={controller.add}><Plus size={16} aria-hidden="true" />Add specification</button>
    <p className={styles.hint}>Up to {MAX_PRODUCT_SPECIFICATIONS} fields per product. Field names must be unique. Completely empty rows are ignored when saving.</p>
  </section>;
}
