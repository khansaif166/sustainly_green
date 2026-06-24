"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";

/* ================= TYPES ================= */

type RFQ = {
  id: string;
  requirementTitle: string;
  estimatedQuantity: string;
  requiredTimeline: string;
  deliveryCountry: string;
  status: string;
  createdAt: string;
};

/* ================= PAGE ================= */

export default function BuyerRFQReportPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    async function loadRfqs() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/buyer/rfqs", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Unable to load RFQ report.");
        }

        setRfqs(payload.rfqs || []);
      } catch (err) {
        console.error("BUYER_REPORT_LOAD_ERROR", err);
        setError(err instanceof Error ? err.message : "Unable to load RFQ report.");
      } finally {
        setLoading(false);
      }
    }

    void loadRfqs();
  }, [router]);

  /* ================= METRICS ================= */

  const pending = rfqs.filter((r) => r.status === "RFQ_REQUESTED").length;
  const quoted = rfqs.filter((r) => r.status === "QUOTED").length;
  const accepted = rfqs.filter((r) => r.status === "ACCEPTED").length;

  const barData = [
    {
      name: "Pending",
      value: pending,
      fill: "var(--color-ocean-blue)",
    },
    {
      name: "Quoted",
      value: quoted,
      fill: "var(--color-solar-yellow)",
    },
    {
      name: "Accepted",
      value: accepted,
      fill: "var(--color-primary-green)",
    },
  ];

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(rfqs.length / PAGE_SIZE);
  const paginated = rfqs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ================= EXPORT EXCEL ================= */

  function exportExcel() {
    const data = rfqs.map((r) => ({
      Requirement: r.requirementTitle,
      Quantity: r.estimatedQuantity,
      Timeline: r.requiredTimeline,
      Country: r.deliveryCountry,
      Status: r.status,
      Date: new Date(r.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RFQ Report");
    XLSX.writeFile(wb, "rfq-report.xlsx");
  }

  /* ================= EXPORT PDF ================= */

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("RFQ Detailed Report", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["Requirement", "Qty", "Timeline", "Country", "Status", "Date"]],
      body: rfqs.map((r) => [
        r.requirementTitle,
        r.estimatedQuantity,
        r.requiredTimeline.replaceAll("_", " "),
        r.deliveryCountry,
        r.status.replaceAll("_", " "),
        new Date(r.createdAt).toLocaleDateString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [11, 110, 79], // primary green
      },
    });

    doc.save("rfq-report.pdf");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading report…
      </div>
    );
  }

  return (
    <main className="space-y-8">
      {/* ================= HEADER ================= */}
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

      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            RFQ Reports
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Status analysis & detailed history
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Excel Export */}
          <button
            onClick={exportExcel}
            className="
      inline-flex items-center justify-center gap-2
      px-5 py-2.5
      rounded-full
      text-sm font-medium

      border border-[var(--color-border)]
      bg-[var(--color-bg-white)]
      text-[var(--color-ocean-blue)]

      transition-all duration-200
      hover:bg-[var(--color-ocean-blue)]
      hover:text-white
      hover:border-[var(--color-ocean-blue)]

      focus:outline-none
      focus:ring-2
      focus:ring-[var(--color-ocean-blue)]/30
    "
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>

          {/* PDF Export (Primary) */}
          <button
            onClick={exportPDF}
            className="
      inline-flex items-center justify-center gap-2
      px-5 py-2.5
      rounded-full
      text-sm font-medium

      bg-[var(--color-primary-green)]
      text-white
      border border-[var(--color-primary-green)]

      transition-all duration-200
      hover:bg-opacity-90

      focus:outline-none
      focus:ring-2
      focus:ring-[var(--color-primary-green)]/30
    "
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ================= BAR CHART ================= */}
      <Card title="RFQ Status Overview">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ================= DETAILED GRID ================= */}
      <Card title="Detailed RFQ Report">
        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-10">
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                <th className="py-3 px-4">Status</th>
                <th className="px-4">Date</th>
                <th className="px-4">Requirement</th>
                <th className="px-4">Qty</th>
                <th className="px-4">Timeline</th>
                <th className="px-4">Country</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((r) => (
                <tr
                  key={r.id}
                  className="
              bg-[var(--color-bg-soft)]
              hover:bg-[var(--color-bg-white)]
              transition
              rounded-xl
            "
                >
                  <td className="py-4 px-4">
                    <StatusBadge status={r.status} />
                  </td>

                  <td className="px-4 text-[var(--color-text-secondary)]">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 font-medium text-[var(--color-text-primary)] max-w-[260px] truncate">
                    {r.requirementTitle}
                  </td>

                  <td className="px-4">{r.estimatedQuantity}</td>

                  <td className="px-4">
                    {r.requiredTimeline.replaceAll("_", " ")}
                  </td>

                  <td className="px-4">{r.deliveryCountry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= MOBILE STACKED CARDS ================= */}
        <div className="md:hidden space-y-4">
          {paginated.map((r) => (
            <div
              key={r.id}
              className="
          rounded-2xl
          p-4
          bg-[var(--color-bg-soft)]
          shadow-sm
          space-y-3
        "
            >
              <div className="flex justify-between items-center">
                <StatusBadge status={r.status} />
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="font-medium text-[var(--color-text-primary)]">
                {r.requirementTitle}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Info label="Qty" value={r.estimatedQuantity} />
                <Info
                  label="Timeline"
                  value={r.requiredTimeline.replaceAll("_", " ")}
                />
                <Info label="Country" value={r.deliveryCountry} />
              </div>
            </div>
          ))}
        </div>

        {/* ================= PAGINATION BAR ================= */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Showing {(page - 1) * PAGE_SIZE + 1} –{" "}
            {Math.min(page * PAGE_SIZE, rfqs.length)} of {rfqs.length}
          </p>

          <div className="flex items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="
          px-5 py-2 rounded-full text-sm font-medium
          border border-[var(--color-border)]
          bg-[var(--color-bg-white)]
          text-[var(--color-ocean-blue)]
          transition-all
          hover:bg-[var(--color-ocean-blue)]
          hover:text-white
          disabled:opacity-40 disabled:cursor-not-allowed
        "
            >
              ← Prev
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="
          px-5 py-2 rounded-full text-sm font-medium
          bg-[var(--color-ocean-blue)]
          text-white border border-[var(--color-ocean-blue)]
          transition-all
          hover:bg-opacity-90
          disabled:opacity-40 disabled:cursor-not-allowed
        "
            >
              Next →
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}

/* ================= UI ================= */

function Card({ title, children }: any) {
  return (
    <div className="rounded-3xl p-6 bg-[var(--color-bg-white)] shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    RFQ_REQUESTED:
      "bg-[var(--color-ocean-blue)]/10 text-[var(--color-ocean-blue)]",
    QUOTED:
      "bg-[var(--color-solar-yellow)]/20 text-[var(--color-solar-yellow)]",
    ACCEPTED:
      "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
