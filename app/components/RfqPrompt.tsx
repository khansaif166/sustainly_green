"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, X } from "lucide-react";

export const OPEN_RFQ_PROMPT_EVENT = "sustainly:open-rfq-prompt";
const SESSION_KEY = "sustainly.rfq-prompt-shown";
const PROMPT_DELAY_MS = 60_000;

export default function RfqPrompt() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function showPrompt() {
      setOpen(true);
      window.sessionStorage.setItem(SESSION_KEY, "true");
    }

    window.addEventListener(OPEN_RFQ_PROMPT_EVENT, showPrompt);
    if (new URLSearchParams(window.location.search).get("rfq") === "1") {
      showPrompt();
    }
    return () => window.removeEventListener(OPEN_RFQ_PROMPT_EVENT, showPrompt);
  }, []);

  useEffect(() => {
    if (pathname !== "/" || window.sessionStorage.getItem(SESSION_KEY)) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      window.sessionStorage.setItem(SESSION_KEY, "true");
    }, PROMPT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (!open) return null;

  return (
    <div className="rfq-prompt-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section
        className="rfq-prompt-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfq-prompt-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="rfq-prompt-close" aria-label="Close RFQ message" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>
        <div className="rfq-prompt-icon"><ClipboardList size={25} /></div>
        <p className="rfq-prompt-eyebrow">Source sustainably</p>
        <h2 id="rfq-prompt-title">Have a sourcing requirement?</h2>
        <p className="rfq-prompt-copy">
          Share what you need and receive quotations from relevant sustainable suppliers on Sustainly Green.
        </p>
        <div className="rfq-prompt-actions">
          <Link href="/buyer/rfq/new" className="rfq-prompt-primary" onClick={() => setOpen(false)}>
            Submit an RFQ <ArrowRight size={16} />
          </Link>
          <button type="button" className="rfq-prompt-secondary" onClick={() => setOpen(false)}>Maybe later</button>
        </div>
      </section>
    </div>
  );
}
