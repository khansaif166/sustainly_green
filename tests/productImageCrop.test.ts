import assert from "node:assert/strict";
import test from "node:test";
import { clampPosition, DEFAULT_IMAGE_CROP, getCropGeometry } from "../lib/productImageCrop";

test("a 3:2 source fits without losing any edges", () => {
  const result = getCropGeometry(1200, 800, DEFAULT_IMAGE_CROP);
  assert.equal(result.width, 1200);
  assert.equal(result.height, 800);
  assert.equal(result.overflowX, 0);
  assert.equal(result.overflowY, 0);
});

test("portrait and panorama sources fill the frame without stretching", () => {
  for (const [width, height] of [[800, 1200], [10000, 200]]) {
    const result = getCropGeometry(width, height, DEFAULT_IMAGE_CROP);
    assert.equal(result.width / result.height, 1.5);
    assert(result.width <= width);
    assert(result.height <= height);
    assert(result.width === width || result.height === height);
  }
});

test("quarter turns exchange source dimensions, half turns preserve them", () => {
  for (const rotation of [0, 90, 180, 270] as const) {
    const result = getCropGeometry(800, 1200, { ...DEFAULT_IMAGE_CROP, rotation });
    assert.equal(result.width, rotation === 90 || rotation === 270 ? 1200 : 800);
    assert.equal(result.width / result.height, 1.5);
  }
});

test("zoom selects a smaller source area while keeping the same aspect ratio", () => {
  const result = getCropGeometry(1200, 800, { ...DEFAULT_IMAGE_CROP, zoom: 2 });
  assert.equal(result.width, 600);
  assert.equal(result.height, 400);
  assert.equal(result.overflowX, 300);
  assert.equal(result.overflowY, 200);
});

test("pan limits keep the entire crop within the rotated photo", () => {
  for (const rotation of [0, 90, 180, 270] as const) {
    const rotatedWidth = rotation % 180 ? 800 : 1200;
    const rotatedHeight = rotation % 180 ? 1200 : 800;
    for (const position of [-2, -1, 0, 1, 2]) {
      const result = getCropGeometry(1200, 800, { rotation, zoom: 2, x: position, y: -position });
      assert(Math.abs(result.offsetX) + result.width / 2 <= rotatedWidth / 2);
      assert(Math.abs(result.offsetY) + result.height / 2 <= rotatedHeight / 2);
    }
  }
});

test("zoom and position values are bounded", () => {
  assert.equal(getCropGeometry(1200, 800, { ...DEFAULT_IMAGE_CROP, zoom: 0 }).width, 1200);
  assert.equal(getCropGeometry(1200, 800, { ...DEFAULT_IMAGE_CROP, zoom: 10 }).width, 400);
  assert.equal(clampPosition(-10), -1);
  assert.equal(clampPosition(10), 1);
  assert.equal(clampPosition(0.25), 0.25);
});

test("normalized crop coordinates scale with the source dimensions", () => {
  const crop = { ...DEFAULT_IMAGE_CROP, zoom: 1.75, x: 0.6, y: -0.3 };
  const original = getCropGeometry(1200, 800, crop);
  const scaled = getCropGeometry(2400, 1600, crop);
  assert.equal(scaled.width, original.width * 2);
  assert.equal(scaled.height, original.height * 2);
  assert.equal(scaled.offsetX, original.offsetX * 2);
  assert.equal(scaled.offsetY, original.offsetY * 2);
});
