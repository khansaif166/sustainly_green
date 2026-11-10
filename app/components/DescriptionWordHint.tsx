"use client";

import { descriptionHint, descriptionTopicCoverage } from "@/lib/productSeo";

const TONE_COLOR = { bad: "#b91c1c", ok: "#92400e", good: "#15803d" } as const;

/**
 * Live word counter plus a "what to include" checklist, shown under every
 * product description box. The checklist stays visible when editing an
 * existing listing (unlike the textarea placeholder, which vanishes once the
 * box has text) and ticks topics off as the description covers them.
 */
export default function DescriptionWordHint({ value }: { value: string }) {
  const hint = descriptionHint(value);
  const topics = descriptionTopicCoverage(value);
  const covered = topics.filter((topic) => topic.covered).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 5 }}>
      <span aria-live="polite" style={{ fontSize: 12, fontWeight: 600, color: TONE_COLOR[hint.tone] }}>
        {hint.text}
      </span>

      <div
        style={{
          background: "#f8faf9",
          border: "1px solid rgba(0,0,0,.07)",
          borderRadius: 12,
          padding: "10px 12px",
        }}
      >
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "none", letterSpacing: 0 }}>
          Include in your description · {covered}/{topics.length} covered
        </p>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: "6px 14px",
          }}
        >
          {topics.map((topic) => (
            <li
              key={topic.key}
              title={topic.example}
              style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12, lineHeight: 1.45 }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 15,
                  height: 15,
                  marginTop: 1,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#fff",
                  background: topic.covered ? "#16a34a" : "transparent",
                  border: topic.covered ? "1.5px solid #16a34a" : "1.5px solid #c4ccc7",
                }}
              >
                {topic.covered ? "✓" : ""}
              </span>
              <span style={{ color: topic.covered ? "#15803d" : "#374151" }}>
                <span style={{ fontWeight: 700 }}>{topic.label}</span>
                {!topic.covered && <span style={{ color: "#6b7280" }}> · {topic.example}</span>}
                <span className="sr-only">{topic.covered ? " (covered)" : " (not yet covered)"}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
