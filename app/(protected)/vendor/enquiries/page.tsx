"use client";

import { useEffect, useState } from "react";
import ReplyQuoteModal from "./ReplyQuoteModal";
import {
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
} from "react-icons/fi";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredSession } from "@/lib/supabaseAuth";

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
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [active, setActive] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<RFQStatusFilter>("ALL");

  /* ================= LOAD RFQS ================= */
  useEffect(() => {
    async function loadRfqs() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/vendor/rfqs", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Unable to load RFQs.");
        }

        setRfqs(payload.rfqs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load RFQs.");
      } finally {
        setLoading(false);
      }
    }

    loadRfqs();
  }, [router]);

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
        return "bg-[var(--color-solar-yellow)]/20 text-[var(--color-solar-yellow)]";
      case "QUOTED":
        return "bg-[var(--color-ocean-blue)]/15 text-[var(--color-ocean-blue)]";
      case "ACCEPTED":
        return "bg-[var(--color-primary-green)]/15 text-[var(--color-primary-green)]";
      case "REJECTED":
        return "bg-red-100 text-red-600";
    }
  }

  return (
    <main className="space-y-8 pb-12">
       <Link
        href="/"
        className="
          inline-flex items-center gap-2
          px-5 py-2.5
          rounded-full text-sm font-medium
          bg-[var(--color-bg-white)]
          text-[var(--color-ocean-blue)]
          border border-[var(--color-border)]
          hover:bg-[var(--color-ocean-blue)]
          hover:text-white
          transition
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>


      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Buyer RFQs
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage and respond to quotation requests
          </p>
        </div>

        <span className="text-sm text-[var(--color-text-secondary)]">
          Total RFQs: {rfqs.length}
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition
              ${
                statusFilter === f.key
                  ? "bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))] text-white"
                  : "bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)]/70"
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ================= STATES ================= */}
      {loading && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Loading RFQs…
        </p>
      )}

      {!loading && sorted.length === 0 && (
        <div className="bg-[var(--color-bg-white)] rounded-2xl p-6 text-sm text-[var(--color-text-secondary)] shadow-sm">
          No RFQs found for this filter.
        </div>
      )}

      {/* ================= RFQ GRID ================= */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((r) => (
          <div
            key={r.id}
            className="
              bg-[var(--color-bg-white)]
              rounded-2xl p-5
              shadow-sm hover:shadow-md transition
            "
          >
            {/* TOP */}
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] line-clamp-1">
                  {r.requirementTitle}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  <span className="font-medium text-[var(--color-text-primary)]">
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
              {[
                ["Type", r.requirementType],
                ["Quantity", r.estimatedQuantity],
                [
                  "Timeline",
                  r.requiredTimeline
                    ? r.requiredTimeline.replaceAll("_", " ")
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[var(--color-text-secondary)]">
                    {label}
                  </p>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* MESSAGE */}
            {r.additionalDetails && (
              <div className="mt-4 bg-[var(--color-bg-soft)] rounded-xl p-4 text-sm">
                <p className="font-medium text-[var(--color-text-primary)] mb-1">
                  Buyer Message
                </p>
                <p className="text-[var(--color-text-secondary)] line-clamp-3">
                  {r.additionalDetails}
                </p>
              </div>
            )}

            {/* ACTION */}
            <div className="mt-6 flex justify-end">
              {r.status === "RFQ_REQUESTED" && (
                <button
                  onClick={() => setActive(r)}
                  className="
                    inline-flex items-center gap-2
                    px-5 py-2.5 rounded-full
                    text-sm font-semibold text-white
                    bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
                    hover:opacity-90 transition
                  "
                >
                  <FiSend />
                  Send Quote
                </button>
              )}

              {r.status === "QUOTED" && (
                <StatusPill
                  icon={<FiMessageSquare />}
                  label="Quote Sent"
                  className="bg-[var(--color-ocean-blue)]/15 text-[var(--color-ocean-blue)]"
                />
              )}

              {r.status === "ACCEPTED" && (
                <StatusPill
                  icon={<FiCheckCircle />}
                  label="Accepted"
                  className="bg-[var(--color-primary-green)]/15 text-[var(--color-primary-green)]"
                />
              )}

              {r.status === "REJECTED" && (
                <StatusPill
                  icon={<FiXCircle />}
                  label="Rejected"
                  className="bg-red-100 text-red-600"
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
