"use client";

import { useEffect, useState } from "react";

/** Thin bar under the header showing how far through the article you are. */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    // rAF-throttled: scroll fires far more often than we need to repaint.
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      setPct(scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[300] h-1 bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-green-600 transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
