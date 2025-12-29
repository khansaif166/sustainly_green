"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { FileText, CheckCircle, XCircle } from "lucide-react";

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

export default function BuyerRFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD BUYER RFQS ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const q = query(
        collection(db, "rfqs"),
        where("buyerEmail", "==", u.email),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setRfqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RFQ)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ================= STATUS BADGE ================= */
  function badge(status: string) {
    switch (status) {
      case "RFQ_REQUESTED":
        return "bg-yellow-100 text-yellow-700";
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
    <main className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          My RFQs
        </h1>
        <p className="text-sm text-gray-500">
          Track and manage your quotation requests
        </p>
      </div>

      {/* EMPTY */}
      {!loading && rfqs.length === 0 && (
        <p className="text-sm text-gray-500">
          You haven’t submitted any RFQs yet.
        </p>
      )}

      {/* RFQ GRID */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rfqs.map((r) => (
          <div
            key={r.id}
            className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm line-clamp-2">
                  {r.requirementTitle}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {r.deliveryCountry} • {r.estimatedQuantity}
                </p>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${badge(
                  r.status
                )}`}
              >
                {r.status.replaceAll("_", " ")}
              </span>
            </div>

            {/* DETAILS */}
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>
                <b>Timeline:</b>{" "}
                {r.requiredTimeline.replaceAll("_", " ")}
              </p>

              {r.status === "QUOTED" && r.vendorResponse && (
                <p className="text-blue-700 text-sm font-medium">
                  Quoted: {r.vendorResponse.currency}{" "}
                  {r.vendorResponse.price}
                </p>
              )}
            </div>

            {/* VENDOR MESSAGE */}
            {r.vendorResponse?.message && (
              <div className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-700 mb-4 line-clamp-2">
                {r.vendorResponse.message}
              </div>
            )}

            {/* ACTION */}
            <div className="flex justify-end">
              <Link
                href={`/buyer/rfqs/${r.id}`}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900"
              >
                <FileText className="h-4 w-4" />
                View RFQ
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
