"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { FiPhone, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";

/* ================= PAGE ================= */

export default function BuyerRFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [rfq, setRfq] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  /* ================= LOAD RFQ ================= */
  useEffect(() => {
    async function loadRfq() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`/api/buyer/rfqs/${id}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        if (response.status === 404) {
          router.push("/buyer/rfqs");
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Unable to load RFQ.");
        }

        setRfq(payload.rfq);
      } catch (err) {
        console.error("BUYER_RFQ_DETAIL_LOAD_ERROR", err);
        setError(err instanceof Error ? err.message : "Unable to load RFQ.");
      } finally {
        setLoading(false);
      }
    }

    void loadRfq();
  }, [id, router]);

  /* ================= ACTIONS ================= */
  async function updateQuote(action: "accept" | "reject") {
    const session = getStoredSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/buyer/rfqs/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to update RFQ.");
      }

      setRfq(payload.rfq);
    } catch (err) {
      console.error("BUYER_RFQ_DETAIL_UPDATE_ERROR", err);
      setError(err instanceof Error ? err.message : "Unable to update RFQ.");
    } finally {
      setUpdating(false);
    }
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
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

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
          value={rfq.requiredTimeline?.replaceAll("_", " ")}
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
              onClick={() => updateQuote("accept")}
              disabled={updating}
              className="
                inline-flex items-center gap-2
                px-5 py-2 rounded-full
                bg-[var(--color-primary-green)]
                text-white text-sm font-medium
                hover:opacity-90 disabled:opacity-60
              "
            >
              <CheckCircle className="h-4 w-4" />
              Accept Quote
            </button>

            <button
              onClick={() => updateQuote("reject")}
              disabled={updating}
              className="
                inline-flex items-center gap-2
                px-5 py-2 rounded-full
                border border-red-300
                text-red-600 text-sm font-medium
                hover:bg-red-50 disabled:opacity-60
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
            <FiMail /> {rfq.vendorContact.businessEmail}
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
