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

/* ---------------- TYPES ---------------- */
type RFQ = {
  id: string;
  status: string;
  createdAt?: any;
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD RFQS ---------------- */
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
      setRfqs(snap.docs.map(d => ({ id: d.id, ...d.data() } as RFQ)));
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  /* ---------------- KPI METRICS ---------------- */
  const total = rfqs.length;
  const quoted = rfqs.filter(r => r.status === "QUOTED").length;
  const accepted = rfqs.filter(r => r.status === "ACCEPTED").length;
  const pending = rfqs.filter(r => r.status === "RFQ_REQUESTED").length;

  /* ---------------- TREND DATA (MONTHLY) ---------------- */
  const trendData = Array.from({ length: 6 }).map((_, i) => ({
    name: `M${i + 1}`,
    rfqs: rfqs.filter((_, idx) => idx <= i).length,
    quotes: rfqs.filter((r, idx) => idx <= i && r.status === "QUOTED").length,
  }));

  /* ---------------- STATUS BOARD ---------------- */
  const statusData = [
    { name: "Draft", value: pending },
    { name: "Sent", value: total },
    { name: "Responses", value: quoted },
    { name: "Closed", value: accepted },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading analytics…
      </div>
    );
  }

  return (
    <main className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-semibold">
          Buyer Analytics
        </h1>
        <p className="text-sm text-gray-300 mt-1">
          Overview of your sourcing activity
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Kpi label="RFQs Sent" value={total} />
        <Kpi label="Quotes Received" value={quoted} />
        <Kpi label="Avg Response" value="9.4h" />
        <Kpi label="Shortlisted" value={accepted} />
        <Kpi label="Savings" value="7.8%" />
        <Kpi label="Verified Used" value="80%" />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-sm font-semibold mb-4">Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rfqs" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="quotes" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Board */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-sm font-semibold mb-4">RFQ Status Board</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= TODO + SCORECARD ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-sm font-semibold mb-3">To-Do / Alerts</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• {pending} RFQs awaiting response</li>
            <li>• Compare top quotes</li>
            <li>• Download verification documents</li>
            <li>• Finalize supplier shortlist</li>
          </ul>
        </div>

        {/* Supplier Scorecard (UI Ready) */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-sm font-semibold mb-3">
            Supplier Scorecard (Preview)
          </h2>

          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left py-1">Supplier</th>
                <th>Price</th>
                <th>Lead</th>
                <th>Certs</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr>
                <td className="py-1">EcoSupply</td>
                <td>Low</td>
                <td>Fast</td>
                <td>✓✓✓</td>
              </tr>
              <tr>
                <td className="py-1">GreenWorks</td>
                <td>Med</td>
                <td>Medium</td>
                <td>✓✓</td>
              </tr>
              <tr>
                <td className="py-1">SustainPro</td>
                <td>High</td>
                <td>Fast</td>
                <td>✓✓✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">
        {value}
      </p>
    </div>
  );
}
