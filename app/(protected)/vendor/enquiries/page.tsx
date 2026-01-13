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
  const [statusFilter, setStatusFilter] =
    useState<RFQStatusFilter>("ALL");

  /* ================= LOAD RFQS ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const q = query(
        collection(db, "rfqs"),
        where("vendorId", "==", u.uid)
      );

      const snap = await getDocs(q);
      setRfqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RFQ)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ================= FILTER + SORT ================= */

  const filtered =
    statusFilter === "ALL"
      ? rfqs
      : rfqs.filter((r) => r.status === statusFilter);

  const order: Record<RFQStatusOnly, number> = {
    RFQ_REQUESTED: 1,
    QUOTED: 2,
    ACCEPTED: 3,
    REJECTED: 4,
  };

  const sorted = [...filtered].sort(
    (a, b) => order[a.status] - order[b.status]
  );

  /* ================= STATUS BADGE ================= */

  function badge(status: RFQStatusOnly) {
    switch (status) {
      case "RFQ_REQUESTED":
        return "bg-yellow-100 text-yellow-800";
      case "QUOTED":
        return "bg-blue-100 text-blue-700";
      case "ACCEPTED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
    }
  }

  return (
    <main className="space-y-8 pb-12">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Buyer RFQs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and respond to quotation requests
          </p>
        </div>

        <span className="text-sm text-gray-500">
          Total RFQs: {rfqs.length}
        </span>
      </div>

      {/* ================= FILTER ================= */}
      <div className="flex flex-wrap gap-3">
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
      </div>

      {/* ================= STATES ================= */}
      {loading && (
        <p className="text-sm text-gray-500">Loading RFQs…</p>
      )}

      {!loading && sorted.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-sm text-gray-500 shadow-sm">
          No RFQs found for this filter.
        </div>
      )}

      {/* ================= RFQ GRID ================= */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >
            {/* TOP */}
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
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
                className={`text-xs px-3 py-1 rounded-full font-semibold h-[20px] ${badge(
                  r.status
                )}`}
              >
                {r.status.replaceAll("_", " ")}
              </span>
            </div>

            {/* META */}
            <div className="grid grid-cols-3 gap-3 mt-5 text-xs">
              <div>
                <p className="text-gray-400">Type</p>
                <p className="font-semibold text-gray-900">
                  {r.requirementType}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Quantity</p>
                <p className="font-semibold text-gray-900">
                  {r.estimatedQuantity}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Timeline</p>
                <p className="font-semibold text-gray-900">
                  {r.requiredTimeline
                    ? r.requiredTimeline.replaceAll("_", " ")
                    : "—"}
                </p>
              </div>
            </div>

            {/* MESSAGE */}
            {r.additionalDetails && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm">
                <p className="font-medium text-gray-900 mb-1">
                  Buyer Message
                </p>
                <p className="text-gray-700 line-clamp-3">
                  {r.additionalDetails}
                </p>
              </div>
            )}

            {/* ACTION */}
            <div className="mt-6 flex justify-end">
              {r.status === "RFQ_REQUESTED" && (
                <button
                  onClick={() => setActive(r)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition"
                >
                  <FiSend />
                  Send Quote
                </button>
              )}

              {r.status === "QUOTED" && (
                <StatusPill
                  icon={<FiMessageSquare />}
                  label="Quote Sent"
                  className="bg-blue-50 text-blue-700"
                />
              )}

              {r.status === "ACCEPTED" && (
                <StatusPill
                  icon={<FiCheckCircle />}
                  label="Accepted"
                  className="bg-green-50 text-green-700"
                />
              )}

              {r.status === "REJECTED" && (
                <StatusPill
                  icon={<FiXCircle />}
                  label="Rejected"
                  className="bg-red-50 text-red-700"
                />
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

/* ================= SMALL UI ================= */

function StatusPill({ icon, label, className }: any) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
