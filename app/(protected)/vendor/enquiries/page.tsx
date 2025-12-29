"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ReplyQuoteModal from "./ReplyQuoteModal";
import {
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
} from "react-icons/fi";

/* ================= TYPES ================= */

type RFQStatusOnly = "RFQ_REQUESTED" | "QUOTED" | "ACCEPTED" | "REJECTED";

type RFQStatusFilter = RFQStatusOnly | "ALL";

interface RFQ {
  id: string;
  status: RFQStatusOnly;
  requirementTitle: string;
  buyerName: string;
  deliveryCountry: string;
  requirementType: string;
  estimatedQuantity: string | number;
  requiredTimeline?: string;
  additionalDetails?: string;
}

/* ================= COMPONENT ================= */

export default function VendorRFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [active, setActive] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RFQStatusFilter>("ALL");

  /* ================= LOAD RFQS ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const q = query(collection(db, "rfqs"), where("vendorId", "==", u.uid));

      const snap = await getDocs(q);

      setRfqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RFQ)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ================= FILTER + SORT ================= */

  const filteredRFQs =
    statusFilter === "ALL"
      ? rfqs
      : rfqs.filter((r) => r.status === statusFilter);

  const statusOrder: Record<RFQStatusOnly, number> = {
    RFQ_REQUESTED: 1,
    QUOTED: 2,
    ACCEPTED: 3,
    REJECTED: 4,
  };

  const sortedRFQs = [...filteredRFQs].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  /* ================= STATUS BADGE ================= */

  function badge(status: RFQStatusOnly) {
    switch (status) {
      case "RFQ_REQUESTED":
        return "bg-yellow-200 text-yellow-900";
      case "QUOTED":
        return "bg-blue-100 text-blue-700";
      case "ACCEPTED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <main className="space-y-8 pb-12">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Buyer RFQs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and respond to quotation requests from buyers
          </p>
        </div>

        <div className="text-sm text-gray-500">Total RFQs: {rfqs.length}</div>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-wrap items-center gap-3">
        {[
          { key: "ALL", label: "All" },
          { key: "RFQ_REQUESTED", label: "Pending" },
          { key: "QUOTED", label: "Quoted" },
          { key: "ACCEPTED", label: "Accepted" },
          { key: "REJECTED", label: "Rejected" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key as RFQStatusFilter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${
                statusFilter === f.key
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {f.label}
          </button>
        ))}

        <span className="ml-auto text-sm text-gray-500">
          Showing {sortedRFQs.length}
        </span>
      </div>

      {/* ================= LOADING / EMPTY ================= */}
      {loading && <div className="text-sm text-gray-500">Loading RFQs…</div>}

      {!loading && sortedRFQs.length === 0 && (
        <div className="bg-white border rounded-xl p-6 text-sm text-gray-500">
          No RFQs found for this filter.
        </div>
      )}

      {/* ================= RFQ GRID ================= */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {sortedRFQs.map((r) => (
          <div
            key={r.id}
            className="bg-white border border-gray-200 rounded-2xl
                       hover:shadow-md transition-shadow p-4"
          >
            {/* ===== TOP ===== */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  className="
    text-lg font-semibold text-gray-900 leading-snug
    w-60
    line-clamp-1
  "
                >
                  {r.requirementTitle}
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium text-gray-900">
                    {r.buyerName}
                  </span>{" "}
                  • {r.deliveryCountry}
                </p>
              </div>

              <span
                className={`shrink-0 text-xs px-3 py-1 rounded-full font-semibold ${badge(
                  r.status
                )}`}
              >
                {r.status.replaceAll("_", " ")}
              </span>
            </div>

            {/* ===== META ===== */}
            <div className="grid grid-cols-3 gap-2 mt-5 text-sm text-[12px]">
              <div>
                <p className="text-gray-400">Type</p>
                <p className="font-semibold text-gray-900">{r.requirementType}</p>
              </div>

              <div>
                <p className="text-gray-400">Quantity</p>
                <p className="font-semibold text-gray-900 text-[12px]">
                  {r.estimatedQuantity}
                </p>
              </div>

              <div>
                <p className="text-gray-400">Timeline</p>
                <p className="font-semibold text-gray-900 text-[12px]">
                  {r.requiredTimeline
                    ? r.requiredTimeline.replaceAll("_", " ")
                    : "—"}
                </p>
              </div>
            </div>

            {/* ===== BUYER MESSAGE ===== */}
            {r.additionalDetails && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-1">Buyer Message</p>
                <p className="line-clamp-3">{r.additionalDetails}</p>
              </div>
            )}

            {/* ===== ACTION ===== */}
            <div className="mt-6 flex justify-end">
              {r.status === "RFQ_REQUESTED" && (
                <button
                  onClick={() => setActive(r)}
                  className="inline-flex items-center gap-2
                             px-5 py-2.5 rounded-lg
                             bg-black text-white text-sm font-semibold
                             hover:bg-gray-900 transition"
                >
                  <FiSend className="h-4 w-4" />
                  Send Quote
                </button>
              )}

              {r.status === "QUOTED" && (
                <span
                  className="inline-flex items-center gap-2
                                 px-4 py-2 rounded-lg
                                 bg-blue-50 text-blue-700 text-sm font-semibold
                                 border border-blue-200"
                >
                  <FiMessageSquare />
                  Quote Sent
                </span>
              )}

              {r.status === "ACCEPTED" && (
                <span
                  className="inline-flex items-center gap-2
                                 px-4 py-2 rounded-lg
                                 bg-green-50 text-green-700 text-sm font-semibold
                                 border border-green-200"
                >
                  <FiCheckCircle />
                  Accepted
                </span>
              )}

              {r.status === "REJECTED" && (
                <span
                  className="inline-flex items-center gap-2
                                 px-4 py-2 rounded-lg
                                 bg-red-50 text-red-700 text-sm font-semibold
                                 border border-red-200"
                >
                  <FiXCircle />
                  Rejected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL ================= */}
      {active && (
        <ReplyQuoteModal
          rfq={active}
          onClose={() => setActive(null)}
          onSent={() => {
            setRfqs((prev) =>
              prev.map((x) =>
                x.id === active.id ? { ...x, status: "QUOTED" } : x
              )
            );
            setActive(null);
          }}
        />
      )}
    </main>
  );
}
