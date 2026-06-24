"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Package,
  FileText,
  CheckCircle,
  TrendingUp,
  PlusCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";

/* ================= TYPES ================= */

type RFQ = {
  id: string;
  status: string;
  buyerEmail?: string;
  createdAt?: string;
  vendorResponse?: {
    price?: number;
    currency?: string;
  };
};

/* ================= PAGE ================= */

export default function VendorDashboardPage() {
  const router = useRouter();

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    async function loadDashboard() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/vendor/dashboard", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error?.message || "Unable to load vendor dashboard.",
          );
        }

        setNeedsOnboarding(Boolean(payload.needsOnboarding));
        setRfqs(payload.rfqs || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load vendor dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  /* ================= METRICS ================= */
  const total = rfqs.length;
  const quoted = rfqs.filter((r) => r.status === "QUOTED").length;
  const accepted = rfqs.filter((r) => r.status === "ACCEPTED").length;
  const pending = rfqs.filter((r) => r.status === "RFQ_REQUESTED").length;

  const revenue = rfqs
    .filter((r) => r.status === "ACCEPTED" && r.vendorResponse?.price)
    .reduce((sum, r) => sum + (r.vendorResponse?.price || 0), 0);

  /* ================= CHART DATA ================= */
  const trendData = Array.from({ length: 6 }).map((_, i) => ({
    month: `M${i + 1}`,
    rfqs: rfqs.filter((_, idx) => idx <= i).length,
    deals: rfqs.filter((r, idx) => idx <= i && r.status === "ACCEPTED").length,
  }));

  const statusData = [
    { name: "Pending", value: pending },
    { name: "Quoted", value: quoted },
    { name: "Accepted", value: accepted },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-text-secondary)]">
        Loading vendor analytics…
      </div>
    );
  }

  return (
    <main className="space-y-10 pb-30">
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
          hover:text-white!
          transition
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* ================= HEADER ================= */}
      {needsOnboarding && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-amber-900">
              Complete your vendor profile
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              Finish onboarding to appear in search results and start receiving
              RFQs.
            </p>
          </div>

          <Link
            href="/vendor/onboarding"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white px-6 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            Complete Now
          </Link>
        </div>
      )}

      <section className="flex justify-between items-center ">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Vendor Dashboard
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Track enquiries, quotes, and your sales performance
          </p>
        </div>

        <Link
          href="/vendor/products/new"
          className="
            inline-flex items-center gap-2
            px-5 py-2.5 rounded-full
            bg-[var(--color-primary-green)]
            text-white! text-sm font-medium
            hover:opacity-90
            transition
          "
        >
          <PlusCircle className="h-4 w-4" />
          Add Product
        </Link>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================= KPI ================= */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <PremiumKpi label="RFQs Received" value={total} icon={FileText} />
        <PremiumKpi label="Quotes Sent" value={quoted} icon={TrendingUp} />
        <PremiumKpi label="Deals Won" value={accepted} icon={CheckCircle} />
        <PremiumKpi label="Pending RFQs" value={pending} icon={Package} />
        <PremiumKpi
          label="Revenue"
          value={`$${revenue}`}
          highlight
          icon={TrendingUp}
        />
      </section>

      {/* ================= CHARTS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard title="RFQ & Deals Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rfqs"
                stroke="var(--color-ocean-blue)"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="deals"
                stroke="var(--color-primary-green)"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </PremiumCard>

        <PremiumCard title="RFQ Status Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="var(--color-primary-green)"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>
      </section>

      {/* ================= RECENT RFQS ================= */}
      <PremiumCard title="Recent RFQs">
        <table className="w-full text-sm">
          <thead className="text-[var(--color-text-secondary)]">
            <tr>
              <th className="text-left py-2">Buyer</th>
              <th>Status</th>
              <th>Quote</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody className="text-[var(--color-text-primary)]">
            {rfqs.slice(0, 5).map((r) => (
              <tr
                key={r.id}
                className="border-t border-[var(--color-border)]/40"
              >
                <td className="py-2">{r.buyerEmail || "Buyer"}</td>
                <td className="text-center">{r.status}</td>
                <td className="text-center">
                  {r.vendorResponse?.price
                    ? `${r.vendorResponse.currency} ${r.vendorResponse.price}`
                    : "—"}
                </td>
                <td className="text-center">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PremiumCard>

      {/* ================= ACTIONS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard title="Action Center">
          <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            {[
              `${pending} new RFQs waiting for reply`,
              "Respond to pending quotes",
              "Update product pricing",
              "Upload certifications",
            ].map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </PremiumCard>

        <PremiumCard title="Performance Tips">
          <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>• Respond within 24 hours for higher ranking</li>
            <li>• Keep prices competitive</li>
            <li>• Add certifications to increase trust</li>
            <li>• Update product images regularly</li>
          </ul>
        </PremiumCard>
      </section>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function PremiumCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-3xl p-6
        bg-[var(--color-bg-white)]
        shadow-[0_10px_40px_rgba(0,0,0,0.08)]
      "
    >
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PremiumKpi({
  label,
  value,
  highlight,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  icon: any;
}) {
  return (
    <div
      className={`
        rounded-2xl p-4
        bg-[var(--color-bg-white)]
        shadow-[0_6px_24px_rgba(0,0,0,0.06)]
        flex items-center justify-between
        ${highlight ? "ring-2 ring-[var(--color-solar-yellow)]" : ""}
      `}
    >
      <div>
        <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
        <p className="text-xl font-semibold text-[var(--color-text-primary)] mt-1">
          {value}
        </p>
      </div>

      <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center">
        <Icon className="h-5 w-5 text-[var(--color-primary-green)]" />
      </div>
    </div>
  );
}
