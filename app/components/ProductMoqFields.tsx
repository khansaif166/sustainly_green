import { canSetMoqUnit, MOQ_UNITS } from "@/lib/productMoq";

type Props = {
  quantity: string;
  unit: string;
  onQuantityChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  fieldClassName?: string;
  labelClassName: string;
  inputClassName: string;
  selectClassName: string;
};

export default function ProductMoqFields({
  quantity, unit, onQuantityChange, onUnitChange,
  fieldClassName, labelClassName, inputClassName, selectClassName,
}: Props) {
  return (
    <>
      <label className={fieldClassName}>
        <span className={labelClassName} style={{ display: "block" }}>MOQ</span>
        <input
          className={inputClassName}
          inputMode="decimal"
          placeholder="Min order qty"
          value={quantity}
          onChange={event => {
            const value = event.target.value;
            onQuantityChange(value);
            if (!canSetMoqUnit(value)) onUnitChange("");
          }}
        />
      </label>
      <label className={fieldClassName}>
        <span className={labelClassName} style={{ display: "block" }}>Unit of measure</span>
        <select
          className={selectClassName}
          value={unit}
          disabled={!canSetMoqUnit(quantity)}
          onChange={event => onUnitChange(event.target.value)}
        >
          <option value="">No unit</option>
          {Object.entries(MOQ_UNITS).map(([value, [label]]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
    </>
  );
}
