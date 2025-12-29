"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { CheckCircle, XCircle } from "lucide-react";
import { FiPhone, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function BuyerRFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [rfq, setRfq] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyerEmail, setBuyerEmail] = useState("");

  /* ================= LOAD RFQ ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setBuyerEmail(u.email || "");

      const snap = await getDoc(doc(db, "rfqs", id as string));

      if (!snap.exists()) {
        alert("RFQ not found");
        router.push("/buyer/rfqs");
        return;
      }

      const data = snap.data();

      // 🔐 Security check
      if (data.buyerEmail !== u.email) {
        alert("Unauthorized access");
        router.push("/buyer/rfqs");
        return;
      }

      setRfq({ id: snap.id, ...data });
      setLoading(false);
    });

    return () => unsub();
  }, [id, router]);

  /* ================= ACTIONS ================= */
  async function acceptQuote() {
    if (!id) return;

    await updateDoc(doc(db, "rfqs", id as string), {
      status: "ACCEPTED",
      contactShared: true,
      updatedAt: serverTimestamp(),
    });

    setRfq((prev: any) => (prev ? { ...prev, status: "ACCEPTED" } : prev));
  }

  async function rejectQuote() {
    if (!id) return;

    await updateDoc(doc(db, "rfqs", id as string), {
      status: "REJECTED",
      updatedAt: serverTimestamp(),
    });

    setRfq((prev: any) => (prev ? { ...prev, status: "REJECTED" } : prev));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading RFQ...
      </div>
    );
  }
  if (!rfq) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        RFQ not found
      </div>
    );
  }

  return (
    <main className="space-y-6 max-w-3xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {rfq.requirementTitle}
        </h1>
        <p className="text-sm text-gray-500">
          RFQ Status: <b>{rfq.status.replaceAll("_", " ")}</b>
        </p>
      </div>

      {/* RFQ DETAILS */}
      <div className="bg-white border rounded-2xl p-6 space-y-3">
        <Detail label="Requirement Type" value={rfq.requirementType} />
        <Detail label="Quantity" value={rfq.estimatedQuantity} />
        <Detail label="Delivery Location" value={rfq.deliveryCountry} />
        <Detail
          label="Timeline"
          value={rfq.requiredTimeline.replaceAll("_", " ")}
        />

        {rfq.additionalDetails && (
          <div className="pt-3 text-sm text-gray-700">
            <b>Additional Details:</b>
            <p>{rfq.additionalDetails}</p>
          </div>
        )}
      </div>

      {/* VENDOR QUOTE */}
      {rfq.status === "QUOTED" && rfq.vendorResponse && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-blue-900">
            Vendor Quotation
          </h3>

          <p className="text-lg font-semibold text-blue-900">
            {rfq.vendorResponse.currency} {rfq.vendorResponse.price}
          </p>

          {rfq.vendorResponse.message && (
            <p className="text-sm text-blue-800">
              {rfq.vendorResponse.message}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={acceptQuote}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Accept
            </button>

            <button
              onClick={rejectQuote}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-300 text-red-600 text-sm"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* ACCEPTED MESSAGE */}
      {rfq.status === "ACCEPTED" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          You accepted this quote. Vendor contact details are now shared.
        </div>
      )}

      {rfq.status === "ACCEPTED" && rfq.vendorContact && (
        <div className="border rounded-xl p-4 bg-white space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Vendor Contact Details
          </h3>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <FiPhone className="h-4 w-4 text-gray-500" />
            <span>{rfq.vendorContact.phone}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <FiMail className="h-4 w-4 text-gray-500" />
            <span>{rfq.vendorContact.email}</span>
          </div>

          <a
            href={`https://wa.me/${rfq.vendorContact.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-green-600 hover:underline"
          >
            <FaWhatsapp className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
      )}
    </main>
  );
}

/* ================= SMALL COMPONENT ================= */

function Detail({ label, value }: any) {
  return (
    <p className="text-sm text-gray-700">
      <b>{label}:</b> {value}
    </p>
  );
}
