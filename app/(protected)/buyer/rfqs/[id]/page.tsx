"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { CheckCircle, XCircle } from "lucide-react";
import { FiPhone, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

/* ================= PAGE ================= */

export default function BuyerRFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [rfq, setRfq] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD RFQ ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      const snap = await getDoc(doc(db, "rfqs", id as string));

      if (!snap.exists()) {
        router.push("/buyer/rfqs");
        return;
      }

      const data = snap.data();

      if (data.buyerEmail !== u.email) {
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
    await updateDoc(doc(db, "rfqs", id as string), {
      status: "ACCEPTED",
      contactShared: true,
      updatedAt: serverTimestamp(),
    });

    setRfq((p: any) => ({ ...p, status: "ACCEPTED" }));
  }

  async function rejectQuote() {
    await updateDoc(doc(db, "rfqs", id as string), {
      status: "REJECTED",
      updatedAt: serverTimestamp(),
    });

    setRfq((p: any) => ({ ...p, status: "REJECTED" }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        Loading RFQ…
      </div>
    );
  }

  if (!rfq) return null;

  /* ================= UI ================= */

  return (
    <main className="max-w-3xl space-y-8">
      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {rfq.requirementTitle}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Status:{" "}
          <span className="font-medium text-[var(--color-primary-green)]">
            {rfq.status.replaceAll("_", " ")}
          </span>
        </p>
      </section>

      {/* ================= RFQ DETAILS ================= */}
      <section
        className="
          rounded-3xl p-6
          bg-white
          shadow-[0_15px_40px_rgba(0,0,0,0.08)]
          space-y-3
        "
      >
        <Detail label="Requirement Type" value={rfq.requirementType} />
        <Detail label="Quantity" value={rfq.estimatedQuantity} />
        <Detail label="Delivery Location" value={rfq.deliveryCountry} />
        <Detail
          label="Timeline"
          value={rfq.requiredTimeline.replaceAll("_", " ")}
        />

        {rfq.additionalDetails && (
          <div className="pt-3 text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text-primary)]">
              Additional Details
            </span>
            <p className="mt-1">{rfq.additionalDetails}</p>
          </div>
        )}
      </section>

      {/* ================= VENDOR QUOTE ================= */}
      {rfq.status === "QUOTED" && rfq.vendorResponse && (
        <section
          className="
            rounded-3xl p-6
            bg-[rgba(10,76,138,0.08)]
            space-y-3
          "
        >
          <h3 className="text-sm font-semibold text-[var(--color-ocean-blue)]">
            Vendor Quotation
          </h3>

          <p className="text-xl font-semibold text-[var(--color-ocean-blue)]">
            {rfq.vendorResponse.currency} {rfq.vendorResponse.price}
          </p>

          {rfq.vendorResponse.message && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {rfq.vendorResponse.message}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={acceptQuote}
              className="
                inline-flex items-center gap-2
                px-5 py-2 rounded-full
                bg-[var(--color-primary-green)]
                text-white text-sm font-medium
                hover:opacity-90
              "
            >
              <CheckCircle className="h-4 w-4" />
              Accept Quote
            </button>

            <button
              onClick={rejectQuote}
              className="
                inline-flex items-center gap-2
                px-5 py-2 rounded-full
                border border-red-300
                text-red-600 text-sm font-medium
                hover:bg-red-50
              "
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        </section>
      )}

      {/* ================= ACCEPTED ================= */}
      {rfq.status === "ACCEPTED" && (
        <section
          className="
            rounded-2xl p-4
            bg-[rgba(11,110,79,0.12)]
            text-sm text-[var(--color-primary-green)]
          "
        >
          You accepted this quote. Vendor contact details are now shared.
        </section>
      )}

      {/* ================= CONTACT ================= */}
      {rfq.status === "ACCEPTED" && rfq.vendorContact && (
        <section
          className="
            rounded-3xl p-6
            bg-white
            shadow-[0_12px_35px_rgba(0,0,0,0.08)]
            space-y-3
          "
        >
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Vendor Contact
          </h3>

          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <FiPhone /> {rfq.vendorContact.phone}
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <FiMail /> {rfq.vendorContact.email}
          </div>

          <a
            href={`https://wa.me/${rfq.vendorContact.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2
              text-sm font-medium
              text-green-600
              hover:underline
            "
          >
            <FaWhatsapp /> Chat on WhatsApp
          </a>
        </section>
      )}
    </main>
  );
}

/* ================= SUB COMPONENT ================= */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-[var(--color-text-secondary)]">
      <span className="font-medium text-[var(--color-text-primary)]">
        {label}:
      </span>{" "}
      {value}
    </p>
  );
}
