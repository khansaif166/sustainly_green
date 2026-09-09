"use client";

import { useEffect, useState } from "react";

export type Heading = { id: string; text: string };

/**
 * Sticky contents list with scroll-spy. Headings come from the server, parsed
 * out of the stored article HTML, so this never has to touch the DOM to know
 * what the sections are — only to track which one is in view.
 */
export default function BlogToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    if (!headings.length) return;

    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    // Bottom margin pulls the trigger line up to ~1/3 of the viewport so a
    // heading becomes "active" as it reaches reading position, not when it
    // first appears at the very bottom of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -66% 0px", threshold: 0 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-semibold tracking-wide text-gray-900 uppercase text-[11px]">
        On this page
      </p>
      <ul className="space-y-1 border-l border-gray-200">
        {headings.map((h) => {
          const isActive = h.id === active;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-4 leading-snug transition-colors ${
                  isActive
                    ? "border-green-600 font-medium text-green-700"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
