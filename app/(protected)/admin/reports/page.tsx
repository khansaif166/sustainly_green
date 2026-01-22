"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentData,
} from "firebase/firestore";
import {
  Users,
  UserCheck,
  Package,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ================= TYPES ================= */

type Row = { id: string; [key: string]: any };

/* ================= PAGE ================= */

export default function AdminReportsPage() {
  const [users, setUsers] = useState<Row[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [rfqs, setRfqs] = useState<Row[]>([]);

  const [loading, setLoading] = useState(true);

  // pagination states
  const PAGE_SIZE = 8;
  const [lastUserDoc, setLastUserDoc] = useState<DocumentData | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);

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
    return (
      <div className="p-8 text-sm text-gray-500">Loading admin reports…</div>
    );
  }

  /* ================= STATS ================= */

  const approvedVendors = vendors.filter((v) => v.approved).length;
  const pendingVendors = vendors.filter((v) => !v.approved).length;

  const approvedProducts = products.filter((p) => p.status === "APPROVED").length;
  const pendingProducts = products.filter((p) => p.status === "PENDING").length;

  return (
    <main className="min-h-screen bg-[var(--color-bg-soft)] p-6 space-y-10">

      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Admin Reports
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Real-time system analytics & operational insights
        </p>
      </section>

      {/* ================= KPI GRID ================= */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI icon={Users} label="Total Users" value={users.length} />
        <KPI icon={UserCheck} label="Approved Vendors" value={approvedVendors} highlight />
        <KPI icon={Package} label="Approved Products" value={approvedProducts} />
        <KPI icon={ClipboardList} label="Total RFQs" value={rfqs.length} />
      </div>

      {/* ================= REPORT SECTIONS ================= */}

      <ReportBlock
        title="Users"
        subtitle="All registered users"
        icon={<Users className="h-5 w-5" />}
      >
        <ScrollableTable
          headers={["Email", "Role"]}
          rows={users.map((u) => [u.email, u.role])}
        />
      </ReportBlock>

      <ReportBlock
        title="Vendors"
        subtitle="Vendor approval tracking"
        icon={<UserCheck className="h-5 w-5" />}
      >
        <ScrollableTable
          headers={["Company", "Status"]}
          rows={vendors.map((v) => [
            v.company || "—",
            v.approved ? "Approved" : "Pending",
          ])}
        />
      </ReportBlock>

      <ReportBlock
        title="Products"
        subtitle="Listing & approval reports"
        icon={<Package className="h-5 w-5" />}
      >
        <ScrollableTable
          headers={["Title", "Status"]}
          rows={products.map((p) => [p.title, p.status])}
        />
      </ReportBlock>

      <ReportBlock
        title="RFQs"
        subtitle="Buyer enquiries & pipeline"
        icon={<ClipboardList className="h-5 w-5" />}
      >
        <ScrollableTable
          headers={["Buyer", "Category", "Status"]}
          rows={rfqs.map((r) => [
            r.buyerName || "—",
            r.category || "—",
            r.status || "OPEN",
          ])}
        />
      </ReportBlock>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function KPI({
  icon: Icon,
  label,
  value,
  highlight = false,
}: any) {
  return (
    <div
      className={`
        rounded-2xl p-4
        bg-[var(--color-bg-white)]
        shadow-[0_6px_24px_rgba(0,0,0,0.06)]
        flex items-center justify-between
        transition hover:shadow-lg
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

function ReportBlock({ title, subtitle, icon, children }: any) {
  return (
    <section className="bg-[var(--color-bg-white)] rounded-3xl border border-[var(--color-border)] shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center text-[var(--color-primary-green)]">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">{subtitle}</p>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function ScrollableTable({ headers, rows }: any) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const paginated = rows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="relative max-h-72 overflow-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--color-bg-soft)] border-b">
            <tr>
              {headers.map((h: string, i: number) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No records found
                </td>
              </tr>
            )}

            {paginated.map((r: any[], i: number) => (
              <tr
                key={i}
                className="border-b last:border-none hover:bg-[var(--color-bg-soft)]"
              >
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg border disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
