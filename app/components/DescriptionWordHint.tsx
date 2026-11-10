"use client";

import { descriptionHint } from "@/lib/productSeo";

const TONE_COLOR = { bad: "#b91c1c", ok: "#92400e", good: "#15803d" } as const;

/** Live word counter shown under every product description textarea. */
export default function DescriptionWordHint({ value }: { value: string }) {
  const hint = descriptionHint(value);
  return (
    <span
      aria-live="polite"
      style={{ display: "block", marginTop: 5, fontSize: 12, fontWeight: 600, color: TONE_COLOR[hint.tone] }}
    >
      {hint.text}
    </span>
  );
}
