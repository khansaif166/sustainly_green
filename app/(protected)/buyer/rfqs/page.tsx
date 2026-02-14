"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

/* ================= TYPES ================= */

type RFQ = {
  id: string;
  requirementTitle: string;
  vendorId: string;
  status: string;
  deliveryCountry: string;
  estimatedQuantity: string;
  requiredTimeline: string;
  createdAt?: any;
  vendorResponse?: {
    price?: number;
    currency?: string;
    message?: string;
  };
};

/* ================= PAGE ================= */

export default function BuyerRFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD RFQS ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const q = query(
        collection(db, "rfqs"),
        where("buyerId", "==", u.uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setRfqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RFQ)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ================= STATUS STYLES ================= */
  function statusStyle(status: string) {
    switch (status) {
      case "RFQ_REQUESTED":
        return "bg-[rgba(244,196,48,0.15)] text-[var(--color-solar-yellow)]";
      case "QUOTED":
        return "bg-[rgba(10,76,138,0.15)] text-[var(--color-ocean-blue)]";
      case "ACCEPTED":
        return "bg-[rgba(11,110,79,0.15)] text-[var(--color-primary-green)]";
      case "REJECTED":
        return "bg-[rgba(220,38,38,0.15)] text-red-500";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <main className="space-y-8">
      <Link
        href="/"
        className="
    inline-flex items-center gap-2
    px-5 py-2.5
    rounded-full
    text-sm font-medium

    bg-[var(--color-bg-white)]
    text-[var(--color-ocean-blue)]
    border border-[var(--color-border)]

    transition-all duration-200
    hover:bg-[var(--color-ocean-blue)]
    hover:text-white
    hover:border-[var(--color-ocean-blue)]

    focus:outline-none
    focus:ring-2
    focus:ring-[var(--color-ocean-blue)]/30
  "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* ================= HEADER ================= */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
  {rfqs.map((r) => (
    <div
      key={r.id}
      className="
        flex flex-col
        rounded-3xl
        bg-[var(--color-bg-white)]
        border border-[var(--color-border)]
        shadow-[0_10px_30px_rgba(0,0,0,0.05)]
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
        transition-all duration-300
      "
    >
      {/* ================= CONTENT ================= */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h2 className="font-semibold text-sm text-[var(--color-text-primary)] line-clamp-2">
              {r.requirementTitle}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {r.deliveryCountry} • Qty {r.estimatedQuantity}
            </p>
          </div>

          <StatusBadge status={r.status} />
        </div>

        {/* Meta */}
        <div className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--color-text-primary)]">
            Timeline:
          </span>{" "}
          {r.requiredTimeline.replaceAll("_", " ")}
        </div>

        {/* Quote Slot (reserved space) */}
        <div className="min-h-[24px]">
          {r.status === "QUOTED" && r.vendorResponse ? (
            <p className="font-semibold text-[var(--color-ocean-blue)]">
              Quoted: {r.vendorResponse.currency} {r.vendorResponse.price}
            </p>
          ) : (
            <span className="text-xs text-transparent">—</span>
          )}
        </div>

        {/* Message Slot (reserved space) */}
        <div className="min-h-[44px]">
          {r.vendorResponse?.message ? (
            <div className="
              p-3 rounded-xl
              bg-[var(--color-bg-soft)]
              text-xs text-[var(--color-text-secondary)]
              line-clamp-2
            ">
              {r.vendorResponse.message}
            </div>
          ) : (
            <div className="text-xs text-transparent">—</div>
          )}
        </div>
      </div>

      {/* ================= FOOTER / CTA ================= */}
      <div className="
        px-5 py-4
        border-t border-[var(--color-border)]
        flex justify-end
      ">
        <Link
          href={`/buyer/rfqs/${r.id}`}
          className="
            inline-flex items-center gap-2
            px-5 py-2
            rounded-full
            text-sm font-medium
            bg-[var(--color-primary-green)]
            text-white
            transition hover:bg-opacity-90
          "
        >
          <FileText className="h-4 w-4" />
          View RFQ
        </Link>
      </div>
    </div>
  ))}
</section>


      {/* ================= EMPTY ================= */}
      {!loading && rfqs.length === 0 && (
        <div className="text-sm text-(--color-text-secondary)">
          You haven’t submitted any RFQs yet.
        </div>
      )}

      {/* ================= RFQ CARDS ================= */}
     
    </main>
  );
}
function statusStyle(status: string) {
  switch (status) {
    case "RFQ_REQUESTED":
      return "bg-[var(--color-ocean-blue)]/10 text-[var(--color-ocean-blue)]";
    case "QUOTED":
      return "bg-[var(--color-solar-yellow)]/30 text-[var(--color-solar-yellow)]";
    case "ACCEPTED":
      return "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    RFQ_REQUESTED:
      "bg-[var(--color-solar-yellow)]/25 text-[var(--color-solar-yellow)]",
    QUOTED:
      "bg-[var(--color-ocean-blue)]/15 text-[var(--color-ocean-blue)]",
    ACCEPTED:
      "bg-[var(--color-primary-green)]/15 text-[var(--color-primary-green)]",
    REJECTED:
      "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`
        px-3 py-1
        rounded-full
        text-xs font-semibold
        whitespace-nowrap
        ${map[status] || "bg-gray-100 text-gray-600"}
      `}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
