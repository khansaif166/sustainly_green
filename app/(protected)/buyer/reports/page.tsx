"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";

/* ================= TYPES ================= */
type RFQ = {
  id: string;
  vendorId: string;
  vendorName: string;
  status: string;
  createdAt: Timestamp;
};

/* ================= PAGE ================= */
export default function BuyerRFQReportPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= LOAD RFQS ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const q = query(
        collection(db, "rfqs"),
        where("buyerId", "==", u.uid),
        orderBy("createdAt", "asc")
      );

      const snap = await getDocs(q);
      setRfqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RFQ)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ================= DATE FILTER ================= */
  const filteredRfqs = useMemo(() => {
    return rfqs.filter((r) => {
      const d = r.createdAt.toDate();
      if (fromDate && d < new Date(fromDate)) return false;
      if (toDate && d > new Date(toDate)) return false;
      return true;
    });
  }, [rfqs, fromDate, toDate]);

  /* ================= METRICS ================= */
  const total = filteredRfqs.length;
  const quoted = filteredRfqs.filter((r) => r.status === "QUOTED").length;
  const accepted = filteredRfqs.filter((r) => r.status === "ACCEPTED").length;
  const pending = filteredRfqs.filter(
    (r) => r.status === "RFQ_REQUESTED"
  ).length;

  const vendorsContacted = new Set(filteredRfqs.map((r) => r.vendorId)).size;

  /* ================= CHART DATA ================= */
  const trendData = filteredRfqs.map((r, i) => ({
    index: i + 1,
    rfqs: i + 1,
    quotes: filteredRfqs.slice(0, i + 1).filter((x) => x.status === "QUOTED")
      .length,
  }));

  const statusData = [
    { name: "Pending", value: pending },
    { name: "Quoted", value: quoted },
    { name: "Accepted", value: accepted },
  ];

  /* ================= EXPORT EXCEL ================= */
  function exportExcel() {
    const data = filteredRfqs.map((r) => ({
      Vendor: r.vendorName,
      Status: r.status,
      Date: r.createdAt.toDate().toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RFQ Report");
    XLSX.writeFile(wb, "rfq-report.xlsx");
  }

  /* ================= EXPORT PDF ================= */
  function exportPDF() {
    const doc = new jsPDF();
    doc.text("RFQ Report", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["Vendor", "Status", "Date"]],
      body: filteredRfqs.map((r) => [
        r.vendorName,
        r.status,
        r.createdAt.toDate().toLocaleDateString(),
      ]),
    });

    doc.save("rfq-report.pdf");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-text-secondary)]">
        Loading report…
      </div>
    );
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
      <section className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            RFQ Reports
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            RFQ history, status tracking & vendor insights
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-bg-white)] shadow text-sm"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-green)] text-white text-sm"
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </section>

      {/* ================= DATE FILTER ================= */}
      <section className="flex gap-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="input"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="input"
        />
      </section>

      {/* ================= KPI ================= */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Kpi label="RFQs Sent" value={total} />
        <Kpi label="Vendors Contacted" value={vendorsContacted} />
        <Kpi label="Quotes Received" value={quoted} />
        <Kpi label="Accepted" value={accepted} />
        <Kpi
          label="Response Rate"
          value={`${total ? Math.round((quoted / total) * 100) : 0}%`}
          highlight
        />
      </section>

      {/* ================= CHARTS ================= */}
      <section className="grid md:grid-cols-2 gap-6">
        <Card title="RFQ History">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Line
                dataKey="rfqs"
                stroke="var(--color-ocean-blue)"
                strokeWidth={3}
              />
              <Line
                dataKey="quotes"
                stroke="var(--color-primary-green)"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="RFQ Status Tracking">
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
        </Card>
      </section>
    </main>
  );
}

/* ================= UI COMPONENTS ================= */

function Card({ title, children }: any) {
  return (
    <div className="rounded-3xl p-6 bg-[var(--color-bg-white)] shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Kpi({ label, value, highlight }: any) {
  return (
    <div
      className={`rounded-2xl p-4 bg-[var(--color-bg-white)] shadow ${
        highlight ? "ring-2 ring-[var(--color-solar-yellow)]" : ""
      }`}
    >
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
