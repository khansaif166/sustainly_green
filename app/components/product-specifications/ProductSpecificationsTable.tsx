import type { ProductSpecification } from "@/lib/productSpecifications";
import styles from "./productSpecifications.module.css";

export default function ProductSpecificationsTable({ specifications }: { specifications?: ProductSpecification[] }) {
  if (!specifications?.length) return null;
  return <section className={styles.specifications} aria-label="Product specifications">
    <h2>Product specifications</h2>
    <table className={styles.table}>
      <caption className={styles.srOnly}>Product specifications</caption>
      <tbody>{specifications.map(specification => <tr key={specification.name}>
        <th scope="row">{specification.name}</th><td>{specification.value}</td>
      </tr>)}</tbody>
    </table>
  </section>;
}
