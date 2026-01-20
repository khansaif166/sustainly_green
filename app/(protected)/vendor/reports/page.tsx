"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  Package,
  BarChart3,
  Eye,
  MessageSquare,
  FileDown,
} from "lucide-react";

/* ================= TYPES ================= */

export type Product = {
  id: string;       
  title: string;
  vendorId: string;
  approved: boolean;
  active?: boolean;
  views?: number;
};

type Enquiry = {
  status: string;
};

/* ================= PAGE ================= */

export default function VendorReportsPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setVendorId(user.uid);
    });
    return () => unsub();
  }, []);

  /* ================= REALTIME PRODUCTS ================= */
  useEffect(() => {
    if (!vendorId) return;

    const q = query(
      collection(db, "products"),
      where("vendorId", "==", vendorId)
    );

    const unsub = onSnapshot(q, (snap) => {
  setProducts(
    snap.docs.map((d) => ({
      ...(d.data() as Product),
      id: d.id,
    }))
  );
});

    return () => unsub();
  }, [vendorId]);

  /* ================= REALTIME ENQUIRIES ================= */
  useEffect(() => {
    if (!vendorId) return;

    const q = query(
      collection(db, "rfqs"),
      where("vendorId", "==", vendorId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setEnquiries(snap.docs.map((d) => d.data() as Enquiry));
    });

    return () => unsub();
  }, [vendorId]);

  /* ================= AGGREGATIONS ================= */

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.approved).length;
  const inactiveProducts = totalProducts - activeProducts;

  const totalEnquiries = enquiries.length;
  const responded = enquiries.filter(
    (e) => e.status !== "RFQ_REQUESTED"
  ).length;
  const pending = totalEnquiries - responded;

  const mostViewed = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-[var(--color-bg-soft)] p-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Vendor Reports
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Live product & enquiry analytics
          </p>
        </div>

        <div className="flex gap-3">
          <button className="export-btn secondary">
            <FileDown className="h-4 w-4" />
            Excel
          </button>
          <button className="export-btn primary">
            <FileDown className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI icon={<Package />} label="Total Products" value={totalProducts} />
        <KPI icon={<BarChart3 />} label="Active Products" value={activeProducts} />
        <KPI icon={<Eye />} label="Inactive Products" value={inactiveProducts} />
        <KPI icon={<MessageSquare />} label="Total Enquiries" value={totalEnquiries} />
      </div>

      {/* STATUS BARS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ReportCard title="Product Status">
          <Progress label="Active" value={activeProducts} total={totalProducts} color="bg-[var(--color-primary-green)]" />
          <Progress label="Inactive" value={inactiveProducts} total={totalProducts} color="bg-red-400" />
        </ReportCard>

        <ReportCard title="Enquiry Response">
          <Progress label="Responded" value={responded} total={totalEnquiries} color="bg-[var(--color-ocean-blue)]" />
          <Progress label="Pending" value={pending} total={totalEnquiries} color="bg-yellow-400" />
        </ReportCard>
      </div>

      {/* MOST VIEWED */}
      <ReportCard title="Most Viewed Products">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-text-secondary)]">
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Views</th>
            </tr>
          </thead>
          <tbody>
            {mostViewed.map((p) => (
              <tr key={p.id} className="border-t border-[var(--color-border)]">
                <td className="py-3">{p.title}</td>
                <td className="py-3 text-right font-semibold">
                  {p.views || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportCard>

    </main>
  );
}

/* ================= COMPONENTS ================= */

function KPI({ icon, label, value }: any) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-2xl p-5 border border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center text-[var(--color-primary-green)]">
          {icon}
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, children }: any) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-3xl p-6 border border-[var(--color-border)]">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Progress({ label, value, total, color }: any) {
  const percent = total ? (value / total) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
