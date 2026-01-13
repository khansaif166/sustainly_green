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
      px-4 py-2 rounded-full
      text-sm font-medium
      bg-white/10 backdrop-blur
      border border-white/20
      hover:bg-white/20
      transition
    "
  >
    <ArrowLeft className="h-4 w-4" />
    Back to Home
  </Link>
      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-(--color-text-primary)">
          My RFQs
        </h1>
        <p className="text-sm text-(--color-text-secondary)] mt-1">
          Track vendor responses, pricing and request status
        </p>
      </section>

      {/* ================= EMPTY ================= */}
      {!loading && rfqs.length === 0 && (
        <div className="text-sm text-(--color-text-secondary)">
          You haven’t submitted any RFQs yet.
        </div>
      )}

      {/* ================= RFQ CARDS ================= */}
      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rfqs.map((r) => (
          <div
            key={r.id}
            className="
              rounded-3xl p-5
              bg-white
              shadow-[0_10px_30px_rgba(0,0,0,0.06)]
              hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]
              transition-all
              flex flex-col justify-between
            "
          >
            {/* ================= HEADER ================= */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="font-semibold text-sm text-(--color-text-primary) line-clamp-2">
                  {r.requirementTitle}
                </h2>

                <p className="text-xs text-(--color-text-secondary) mt-1">
                  {r.deliveryCountry} • {r.estimatedQuantity}
                </p>
              </div>

              <span
                className={`
                  text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap
                  ${statusStyle(r.status)}
                `}
              >
                {r.status.replaceAll("_", " ")}
              </span>
            </div>

            {/* ================= DETAILS ================= */}
            <div className="mt-4 space-y-2 text-sm text-(--color-text-secondary)">
              <p>
                <span className="text-black">Timeline:</span>{" "}
                {r.requiredTimeline.replaceAll("_", " ")}
              </p>

              {r.status === "QUOTED" && r.vendorResponse && (
                <p className="font-medium text-(--color-ocean-blue)">
                  Quoted: {r.vendorResponse.currency} {r.vendorResponse.price}
                </p>
              )}
            </div>

            {/* ================= MESSAGE ================= */}
            {r.vendorResponse?.message && (
              <div
                className="
                  mt-4 p-3 rounded-xl
                  bg-(--color-bg-soft)]
                  text-xs text-(--color-text-secondary)
                  line-clamp-2
                "
              >
                {r.vendorResponse.message}
              </div>
            )}

            {/* ================= ACTION ================= */}
            <div className="mt-5 flex justify-end">
              <Link
                href={`/buyer/rfqs/${r.id}`}
                className="
                  inline-flex items-center gap-2
                  text-sm font-medium
                  px-5 py-2 rounded-full
                  bg-(--color-primary-green)
                  text-white
                  hover:opacity-90
                  transition
                "
              >
                <FileText className="h-4 w-4" />
                View RFQ
              </Link>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
