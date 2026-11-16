"use client";

export type ProductTypeOption = { id: string; name: string; subcategoryId: string; active?: boolean };

export default function ProductTypeSelect({
  listingType, subcategoryId, productTypes, value, onChange, className,
}: {
  listingType: string;
  subcategoryId: string;
  productTypes: ProductTypeOption[];
  value: string;
  onChange: (id: string) => void;
  className: string;
}) {
  if (listingType !== "Product") return null;
  const options = productTypes.filter(type => type.subcategoryId === subcategoryId && (type.active !== false || type.id === value));
  return <div className="flex flex-col gap-2">
    <label htmlFor="product-type-select" className="text-xs font-semibold uppercase tracking-wide text-gray-700">Product type (optional)</label>
    <select id="product-type-select" className={className} value={value} onChange={event => onChange(event.target.value)} disabled={!subcategoryId}>
      <option value="">Select product type</option>
      {options.map(type => <option key={type.id} value={type.id}>{type.name}{type.active === false ? " (inactive)" : ""}</option>)}
    </select>
  </div>;
}
