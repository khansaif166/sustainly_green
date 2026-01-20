"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import {
  Users,
  UserCheck,
  Package,
  ClipboardList,
} from "lucide-react";

/* ================= PAGE ================= */

export default function AdminReportsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    const [uSnap, vSnap, pSnap, rSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "vendors")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "rfqs")),
    ]);

    setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setVendors(vSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setRfqs(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    setLoading(false);
  }

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading reports…</p>;
  }

  /* ================= STATS ================= */

  const approvedVendors = vendors.filter((v) => v.approved).length;
  const pendingVendors = vendors.filter((v) => !v.approved).length;

  const approvedProducts = products.filter((p) => p.status === "APPROVED").length;
  const pendingProducts = products.filter((p) => p.status === "PENDING").length;

  return (
    <main className="space-y-12 max-w-full mx-auto">

      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold">Admin Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          System-wide analytics and detailed reports
        </p>
      </section>

      {/* ================= USER REPORTS ================= */}
      <ReportSection title="User Management Reports" icon={<Users />}>
        <GradientCard title="Total Users" value={users.length} />
        <RecentTable
          title="Recent Users"
          headers={["Email", "Role"]}
          rows={users.slice(0, 5).map((u) => [
            u.email,
            u.role,
          ])}
        />
      </ReportSection>

      {/* ================= VENDOR REPORTS ================= */}
      <ReportSection title="Vendor Management Reports" icon={<UserCheck />}>
        <GradientCard title="Approved Vendors" value={approvedVendors} />
        <GradientCard title="Pending Vendors" value={pendingVendors} />

        <RecentTable
          title="Recent Vendors"
          headers={["Company", "Status"]}
          rows={vendors.slice(0, 5).map((v) => [
            v.company || "N/A",
            v.approved ? "Approved" : "Pending",
          ])}
        />
      </ReportSection>

      {/* ================= PRODUCT REPORTS ================= */}
      <ReportSection title="Product & Listing Reports" icon={<Package />}>
        <GradientCard title="Total Products" value={products.length} />
        <GradientCard title="Approved Products" value={approvedProducts} />
        <GradientCard title="Pending Products" value={pendingProducts} />

        <RecentTable
          title="Recent Products"
          headers={["Title", "Status"]}
          rows={products.slice(0, 5).map((p) => [
            p.title,
            p.status,
          ])}
        />
      </ReportSection>

      {/* ================= RFQ REPORTS ================= */}
      <ReportSection title="RFQ & Enquiry Reports" icon={<ClipboardList />}>
        <GradientCard title="Total RFQs" value={rfqs.length} />

        <RecentTable
          title="Recent RFQs"
          headers={["Buyer", "Category", "Status"]}
          rows={rfqs.slice(0, 5).map((r) => [
            r.buyerName || "N/A",
            r.category || "N/A",
            r.status || "OPEN",
          ])}
        />
      </ReportSection>
    </main>
  );
}

/* ================= UI COMPONENTS ================= */

function ReportSection({
  title,
  icon,
  children,
}: any) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
        {icon}
        {title}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </section>
  );
}

function GradientCard({ title, value }: any) {
  return (
    <div
      className="
        rounded-2xl p-5
        bg-gradient-to-br from-emerald-500 to-sky-500
        text-white shadow
        hover:scale-[1.02] transition
      "
    >
      <p className="text-xs opacity-90">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function RecentTable({ title, headers, rows }: any) {
  return (
    <div className="lg:col-span-3 rounded-2xl border bg-white shadow overflow-hidden">
      <div className="p-4 border-b text-sm font-semibold">{title}</div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {headers.map((h: string, i: number) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-medium text-gray-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            )}

            {rows.map((r: any[], i: number) => (
              <tr key={i} className="border-b last:border-none hover:bg-gray-50">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
