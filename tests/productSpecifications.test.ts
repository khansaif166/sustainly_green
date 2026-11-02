import assert from "node:assert/strict";
import test from "node:test";
import { MAX_PRODUCT_SPECIFICATIONS, ProductSpecificationValidationError, productSpecificationsPayload, readProductSpecifications, validateProductSpecifications } from "../lib/productSpecifications";

test("old products and omitted update fields preserve backward compatibility", () => {
  assert.deepEqual(readProductSpecifications(undefined), []);
  assert.deepEqual(readProductSpecifications(null), []);
  assert.deepEqual(productSpecificationsPayload({ title: "Updated title" }), {});
  assert.deepEqual(productSpecificationsPayload({ specifications: [] }), { specifications: [] });
});

test("field names and values normalize whitespace while preserving order and units", () => {
  const input = [{ name: " Material ", value: " Bamboo " }, { name: "Capacity", value: "500 ml" }, { name: "Notes", value: "Line one\nLine two" }];
  const original = structuredClone(input);
  assert.deepEqual(validateProductSpecifications(input), [{ name: "Material", value: "Bamboo" }, input[1], input[2]]);
  assert.deepEqual(input, original);
});

test("case-insensitive duplicate names identify the offending row", () => {
  assert.throws(() => validateProductSpecifications([{ name: "Material", value: "Bamboo" }, { name: " material ", value: "Wood" }]),
    (error: unknown) => error instanceof ProductSpecificationValidationError && error.issues[0].index === 1 && error.issues[0].field === "name");
});

test("empty editor rows are ignored but partially completed rows require correction", () => {
  assert.deepEqual(validateProductSpecifications([{ name: " ", value: "\n" }, { name: "Material", value: "Bamboo" }], true), [{ name: "Material", value: "Bamboo" }]);
  for (const row of [{ name: "Material", value: "" }, { name: "", value: "Bamboo" }, { name: "\t", value: "" }]) {
    assert.throws(() => validateProductSpecifications([row]), ProductSpecificationValidationError);
  }
  assert.throws(() => validateProductSpecifications([{ name: "Material", value: "" }], true), ProductSpecificationValidationError);
});

test("API requires plain name/value arrays and rejects malformed or extra properties", () => {
  for (const input of [null, undefined, "Material: Bamboo", {}, [null], ["Material"], [["Material", "Bamboo"]], [{ name: "Material" }], [{ name: 1, value: "Bamboo" }], [{ name: "Material", value: {} }], [{ name: "Material", value: "Bamboo", approved: true }]]) {
    assert.throws(() => validateProductSpecifications(input), ProductSpecificationValidationError);
  }
});

test("field counts and text lengths enforce supported boundaries", () => {
  const fields = Array.from({ length: MAX_PRODUCT_SPECIFICATIONS }, (_, i) => ({ name: `Field ${i}`, value: "Value" }));
  assert.equal(validateProductSpecifications(fields).length, MAX_PRODUCT_SPECIFICATIONS);
  assert.throws(() => validateProductSpecifications([...fields, { name: "Extra", value: "Value" }]), ProductSpecificationValidationError);
  assert.equal(validateProductSpecifications([{ name: "n".repeat(80), value: "v".repeat(1000) }]).length, 1);
  assert.throws(() => validateProductSpecifications([{ name: "n".repeat(81), value: "Value" }]), ProductSpecificationValidationError);
  assert.throws(() => validateProductSpecifications([{ name: "Name", value: "v".repeat(1001) }]), ProductSpecificationValidationError);
});

test("Unicode and HTML-like content remain plain text rather than executable markup", () => {
  const fields = [{ name: "सामग्री", value: "बाँस" }, { name: "Details", value: '<img src=x onerror="alert(1)">' }];
  assert.deepEqual(validateProductSpecifications(fields), fields);
  assert.throws(() => validateProductSpecifications([{ name: "Name", value: "a\0b" }]), ProductSpecificationValidationError);
});
