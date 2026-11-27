export const MOQ_UNITS = {
  piece: ["Piece", "pieces"],
  unit: ["Unit", "units"],
  pair: ["Pair", "pairs"],
  set: ["Set", "sets"],
  dozen: ["Dozen", "dozen"],
  pack: ["Pack", "packs"],
  box: ["Box", "boxes"],
  carton: ["Carton", "cartons"],
  case: ["Case", "cases"],
  bag: ["Bag", "bags"],
  bottle: ["Bottle", "bottles"],
  roll: ["Roll", "rolls"],
  sheet: ["Sheet", "sheets"],
  bundle: ["Bundle", "bundles"],
  bale: ["Bale", "bales"],
  crate: ["Crate", "crates"],
  drum: ["Drum", "drums"],
  pallet: ["Pallet", "pallets"],
  gram: ["Gram", "grams"],
  kilogram: ["Kilogram", "kilograms"],
  tonne: ["Tonne", "tonnes"],
  millilitre: ["Millilitre", "millilitres"],
  litre: ["Litre", "litres"],
  centimetre: ["Centimetre", "centimetres"],
  metre: ["Metre", "metres"],
  square_metre: ["Square Metre", "square metres"],
  cubic_metre: ["Cubic Metre", "cubic metres"],
} as const;

export type MoqUnit = keyof typeof MOQ_UNITS;

function isMoqUnit(value: unknown): value is MoqUnit {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MOQ_UNITS, value);
}

export function canSetMoqUnit(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return false;
  const quantity = Number(value);
  // MOQ is stored as numeric(14,2). Quantities below 0.005 round to zero.
  return quantity >= 0.005 && quantity <= 999999999999.99;
}

export class MoqValidationError extends Error {}

export function productMoqPayload(body: Record<string, unknown>, moq: number | null): {
  moq: number | null;
  moq_unit?: MoqUnit | null;
} {
  const unit = typeof body.moqUnit === "string" ? body.moqUnit.trim() : body.moqUnit;
  const canSetUnit = canSetMoqUnit(body.moq);

  // PostgREST preserves the stored unit when the update omits the column.
  if (unit === undefined && canSetUnit) return { moq };
  if (unit === undefined || unit === null || unit === "") return { moq, moq_unit: null };
  if (!isMoqUnit(unit)) throw new MoqValidationError("Choose a supported unit of measure for MOQ.");
  if (!canSetUnit) throw new MoqValidationError("Enter a valid positive MOQ to select a unit of measure.");
  return { moq, moq_unit: unit };
}

export function formatMoq(quantity: number | string | null | undefined, unit?: string | null) {
  const amount = Number(quantity);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (!isMoqUnit(unit)) return String(amount);
  const [singular, plural] = MOQ_UNITS[unit];
  return `${amount} ${amount === 1 ? singular.toLowerCase() : plural}`;
}
