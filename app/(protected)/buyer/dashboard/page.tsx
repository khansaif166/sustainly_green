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
import Header from "@/app/components/Header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* ================= TYPES ================= */
type RFQ = {
  id: string;
  status: string;
  createdAt?: any;
};

/* ================= PAGE ================= */
export default function BuyerDashboardPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      const q = query(
        collection(db, "rfqs"),
        where("buyerId", "==", u.uid),
        orderBy("createdAt", "asc")
      );

      const snap = await getDocs(q);
      setRfqs(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as RFQ))
      );
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  /* ================= METRICS ================= */
  const total = rfqs.length;
  const quoted = rfqs.filter((r) => r.status === "QUOTED").length;
  const accepted = rfqs.filter((r) => r.status === "ACCEPTED").length;
  const pending = rfqs.filter(
    (r) => r.status === "RFQ_REQUESTED"
  ).length;

  /* ================= CHART DATA ================= */
  const trendData = Array.from({ length: 6 }).map((_, i) => ({
    month: `M${i + 1}`,
    rfqs: rfqs.filter((_, idx) => idx <= i).length,
    quotes: rfqs.filter(
      (r, idx) => idx <= i && r.status === "QUOTED"
    ).length,
  }));

  const statusData = [
    { name: "Pending", value: pending },
    { name: "Quoted", value: quoted },
    { name: "Accepted", value: accepted },
  ];

  const supplierScorecard = [
    { name: "EcoSupply", price: "Low", lead: "Fast", certs: "✓✓✓" },
    { name: "GreenWorks", price: "Medium", lead: "Medium", certs: "✓✓" },
    { name: "SustainPro", price: "High", lead: "Fast", certs: "✓✓✓" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-text-secondary)]">
        Loading analytics…
      </div>
    );
  }

  return (
    <>
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
    <main className="space-y-8 mt-5">
      {/* ================= KPI ================= */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <PremiumKpi label="RFQs Sent" value={total} />
        <PremiumKpi label="Quotes Received" value={quoted} />
        <PremiumKpi label="Accepted Deals" value={accepted} />
        <PremiumKpi label="Pending RFQs" value={pending} />
        <PremiumKpi
          label="Response Rate"
          value={`${total ? Math.round((quoted / total) * 100) : 0}%`}
          highlight
        />
      </section>

      {/* ================= CHARTS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard title="RFQ Activity Trend">
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
                dataKey="quotes"
                stroke="var(--color-primary-green)"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </PremiumCard>

        <PremiumCard title="RFQ Status Overview">
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

      {/* ================= ACTIONS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard title="Action Items">
          <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            {[
              `${pending} RFQs awaiting vendor response`,
              "Compare received quotations",
              "Shortlist top suppliers",
              "Finalize purchase decisions",
            ].map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </PremiumCard>

        <PremiumCard title="Supplier Quality Snapshot">
          <table className="w-full text-sm">
            <thead className="text-[var(--color-text-secondary)]">
              <tr>
                <th className="text-left py-2">Supplier</th>
                <th>Price</th>
                <th>Lead Time</th>
                <th>Certs</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-text-primary)]">
              {supplierScorecard.map((s) => (
                <tr
                  key={s.name}
                  className="border-t border-[var(--color-border)]/40"
                >
                  <td className="py-2">{s.name}</td>
                  <td className="text-center">{s.price}</td>
                  <td className="text-center">{s.lead}</td>
                  <td className="text-center">{s.certs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PremiumCard>
      </section>
    </main>
    </>
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
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl p-4
        bg-[var(--color-bg-white)]
        shadow-[0_6px_24px_rgba(0,0,0,0.06)]
        ${highlight ? "ring-2 ring-[var(--color-solar-yellow)]" : ""}
      `}
    >
      <p className="text-xs text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className="text-xl font-semibold text-[var(--color-text-primary)] mt-1">
        {value}
      </p>
    </div>
  );
}
