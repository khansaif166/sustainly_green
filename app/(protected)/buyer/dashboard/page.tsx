"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
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
  Cell,
} from "recharts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* ================= TYPES ================= */

type RFQ = {
  estimatedQuantity: string;
  requiredTimeline: any;
  deliveryCountry: string;
  id: string;
  requirementTitle: string;
  status: string;
  createdAt: Timestamp;
};

/* ================= PAGE ================= */

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH + REALTIME DATA ================= */

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      const q = query(
        collection(db, "rfqs"),
        where("buyerId", "==", u.uid),
        orderBy("createdAt", "asc")
      );

      const unsubData = onSnapshot(q, (snap) => {
        setRfqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RFQ)));
        setLoading(false);
      });

      return () => unsubData();
    });

    return () => unsubAuth();
  }, [router]);

  /* ================= KPIs ================= */

  const total = rfqs.length;
  const pending = rfqs.filter((r) => r.status === "RFQ_REQUESTED").length;
  const quoted = rfqs.filter((r) => r.status === "QUOTED").length;
  const accepted = rfqs.filter((r) => r.status === "ACCEPTED").length;

  /* ================= LINE CHART (TIME BASED) ================= */

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};

    rfqs.forEach((r) => {
      const d = r.createdAt.toDate();
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map).map(([k, v]) => ({
      month: k,
      rfqs: v,
    }));
  }, [rfqs]);

  /* ================= BAR CHART ================= */

  const statusData = [
    { name: "Pending", value: pending, fill: "var(--color-ocean-blue)" },
    { name: "Quoted", value: quoted, fill: "var(--color-solar-yellow)" },
    { name: "Accepted", value: accepted, fill: "var(--color-primary-green)" },
  ];

  /* ================= RECENT ================= */

  const recentRfqs = [...rfqs]
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard…
      </div>
    );
  }

  return (
    <>
      {/* ================= BACK ================= */}
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

      <main className="space-y-8 mt-6">
        {/* ================= KPI ================= */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Kpi label="Total RFQs" value={total} />
          <Kpi label="Pending" value={pending} />
          <Kpi label="Quoted" value={quoted} />
          <Kpi label="Accepted" value={accepted} />
          <Kpi
            label="Response Rate"
            value={`${total ? Math.round((quoted / total) * 100) : 0}%`}
            highlight
          />
        </section>

        {/* ================= CHARTS ================= */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Line */}
          <Card title="RFQs Over Time">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  dataKey="rfqs"
                  stroke="var(--color-ocean-blue)"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar */}
          <Card title="RFQ Status Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={statusData}
                barCategoryGap={32}
                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-bg-white)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ================= RECENT RFQS ================= */}
        <Card title="Recent RFQs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-2">
              {/* ===== HEADER ===== */}
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Requirement</th>
                  <th className="px-4 py-2 text-left">Qty</th>
                  <th className="px-4 py-2 text-left">Timeline</th>
                  <th className="px-4 py-2 text-left">Country</th>
                </tr>
              </thead>

              {/* ===== ROWS ===== */}
              <tbody>
                {recentRfqs.map((r) => (
                  <tr
                    key={r.id}
                    className="
              bg-[var(--color-bg-soft)]
              rounded-xl
              hover:bg-[var(--color-bg-white)]
              transition
            "
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {r.createdAt.toDate().toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)] max-w-[240px] truncate">
                      {r.requirementTitle}
                    </td>

                    <td className="px-4 py-3">{r.estimatedQuantity}</td>

                    <td className="px-4 py-3">
                      {r.requiredTimeline.replaceAll("_", " ")}
                    </td>

                    <td className="px-4 py-3">{r.deliveryCountry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}

/* ================= UI ================= */

function Card({ title, children }: any) {
  return (
    <div className="rounded-3xl p-6 bg-[var(--color-bg-white)] shadow">
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
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    RFQ_REQUESTED:
      "bg-[var(--color-ocean-blue)]/10 text-[var(--color-ocean-blue)]",
    QUOTED:
      "bg-[var(--color-solar-yellow)]/30 text-[var(--color-solar-yellow)]",
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
