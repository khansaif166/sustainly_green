export const MAX_PRODUCT_SPECIFICATIONS = 20;
export const MAX_SPECIFICATION_NAME_LENGTH = 80;
export const MAX_SPECIFICATION_VALUE_LENGTH = 1000;

export type ProductSpecification = { name: string; value: string };
export type SpecificationIssue = { index: number; field: "name" | "value" | "specifications"; message: string };

export class ProductSpecificationValidationError extends Error {
  constructor(public issues: SpecificationIssue[]) {
    super(issues[0]?.message || "Correct the product specifications.");
    this.name = "ProductSpecificationValidationError";
  }
}

/** Array order is the display order. Empty draft rows may be ignored by the editor only. */
export function validateProductSpecifications(input: unknown, ignoreEmptyRows = false): ProductSpecification[] {
  const issues: SpecificationIssue[] = [];
  if (!Array.isArray(input) || input.length > MAX_PRODUCT_SPECIFICATIONS) {
    throw new ProductSpecificationValidationError([{ index: -1, field: "specifications", message: `Use an array of at most ${MAX_PRODUCT_SPECIFICATIONS} specifications.` }]);
  }
  const names = new Set<string>();
  const specifications: ProductSpecification[] = [];
  input.forEach((row: unknown, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row) ||
      Object.keys(row).length !== 2 || !("name" in row) || !("value" in row) ||
      typeof row.name !== "string" || typeof row.value !== "string") {
      issues.push({ index, field: "specifications", message: `Specification ${index + 1} must contain a text field name and value.` });
      return;
    }
    const name = row.name.trim(), value = row.value.trim();
    if (ignoreEmptyRows && !name && !value) return;
    if (name.includes("\0") || value.includes("\0")) {
      issues.push({ index, field: "specifications", message: `Specification ${index + 1} contains an unsupported null character.` });
      return;
    }
    if (!name || [...name].length > MAX_SPECIFICATION_NAME_LENGTH) {
      issues.push({ index, field: "name", message: `Specification ${index + 1}: enter a field name of 1–${MAX_SPECIFICATION_NAME_LENGTH} characters.` });
    } else if (names.has(name.toLowerCase())) {
      issues.push({ index, field: "name", message: `Specification ${index + 1}: the field name “${name}” is already used.` });
    }
    names.add(name.toLowerCase());
    if (!value || [...value].length > MAX_SPECIFICATION_VALUE_LENGTH) {
      issues.push({ index, field: "value", message: `Specification ${index + 1}: enter a value of 1–${MAX_SPECIFICATION_VALUE_LENGTH} characters.` });
    }
    specifications.push({ name, value });
  });
  if (issues.length) throw new ProductSpecificationValidationError(issues);
  return specifications;
}

export function readProductSpecifications(value: unknown): ProductSpecification[] {
  if (value === undefined || value === null) return [];
  return validateProductSpecifications(value);
}

/** Omitted fields preserve existing specifications for older API clients. [] explicitly clears them. */
export function productSpecificationsPayload(body: Record<string, unknown>) {
  return body.specifications === undefined ? {} : { specifications: validateProductSpecifications(body.specifications) };
}
