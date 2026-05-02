"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckCircle, XCircle, Search, Filter, Trash2,
  Building2, Users, ShoppingCart,
} from "lucide-react";

/* ── Types ── */
type Buyer = {
  uid: string;
  status: "submitted" | "draft";
  approved: boolean;
  companyInfo?: {
    companyName?: string;
    organisationType?: string;
    city?: string;
    country?: string;
    email?: string;
    mobile?: string;
    contactPerson?: string;
  };
  businessOverview?: {
    buyerSegment?: string;
    industry?: string;
    annualRevenue?: string;
    noOfEmployees?: string;
    geographyOfOperation?: string;
  };
  sustainability?: {
    sustainabilityPolicy?: string;
    esgReport?: string;
  };
  procurement?: {
    categoriesNeeded?: string[];
    minCertificationRequired?: string;
  };
  updatedAt?: any;
};

/* ── Page ── */
export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "DRAFT">("ALL");
  const [segmentFilter, setSegmentFilter] = useState("ALL");

  async function fetchBuyers() {
    const snap = await getDocs(collection(db, "buyers"));
    setBuyers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Buyer)));
    setLoading(false);
  }

  useEffect(() => { fetchBuyers(); }, []);

  async function approveBuyer(uid: string) {
    await updateDoc(doc(db, "buyers", uid), { approved: true });
    await updateDoc(doc(db, "users", uid), { buyerApproved: true });
    fetchBuyers();
  }

  async function rejectBuyer(uid: string) {
    await updateDoc(doc(db, "buyers", uid), { approved: false });
    fetchBuyers();
  }

  async function deleteBuyer(uid: string) {
    if (confirm("Delete this buyer profile? This cannot be undone.")) {
      await deleteDoc(doc(db, "buyers", uid));
      fetchBuyers();
    }
  }

  const SEGMENTS = ["ALL", "corporate", "msme", "distributor", "retailer"];

  const filtered = useMemo(() => {
    return buyers.filter(b => {
      const name = b.companyInfo?.companyName?.toLowerCase() ?? "";
      const email = b.companyInfo?.email?.toLowerCase() ?? "";
      const matchSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "SUBMITTED" && b.status === "submitted") ||
        (statusFilter === "DRAFT" && b.status === "draft");
      const matchSegment =
        segmentFilter === "ALL" || b.businessOverview?.buyerSegment === segmentFilter;
      return matchSearch && matchStatus && matchSegment;
    });
  }, [buyers, search, statusFilter, segmentFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  const total = buyers.length;
  const submitted = buyers.filter(b => b.status === "submitted").length;
  const drafts = buyers.filter(b => b.status === "draft").length;

  return (
    <main className="max-w-full mx-auto space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Buyer Management</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Review and manage buyer onboarding profiles
        </p>
      </section>

      {/* KPI Strip */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Buyers", value: total, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Submitted", value: submitted, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Draft / Incomplete", value: drafts, icon: Building2, color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border)] p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
              <p className="text-xl font-semibold text-[var(--color-text-primary)]">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Filter Bar */}
      <section className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border)] p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company name or email…"
            className="w-full rounded-xl border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm bg-[var(--color-bg-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)]/20"
          />
        </div>

        <div className="relative w-full md:w-44">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full rounded-xl border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm bg-[var(--color-bg-white)] focus:outline-none appearance-none"
          >
            <option value="ALL">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        <div className="relative w-full md:w-44">
          <ShoppingCart className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <select
            value={segmentFilter}
            onChange={e => setSegmentFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm bg-[var(--color-bg-white)] focus:outline-none appearance-none"
          >
            {SEGMENTS.map(s => (
              <option key={s} value={s}>{s === "ALL" ? "All Segments" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Grid */}
      {filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">No buyer profiles found.</p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(b => {
          const ci = b.companyInfo ?? {};
          const bo = b.businessOverview ?? {};
          const pro = b.procurement ?? {};

          return (
            <div key={b.uid} className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex flex-col">
              {/* Card Header */}
              <div
                className="p-5 rounded-t-3xl"
                style={{ background: b.status === "submitted" ? "var(--gradient-brand-soft)" : "transparent" }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-soft)] text-[var(--color-primary-green)] flex items-center justify-center font-bold text-lg border border-gray-200 shrink-0 uppercase">
                      {ci.companyName?.charAt(0) ?? "B"}
                    </div>
                    <div>
                      <h2 className="font-semibold text-[var(--color-text-primary)] text-sm leading-tight">
                        {ci.companyName || "—"}
                      </h2>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {bo.buyerSegment ? bo.buyerSegment.charAt(0).toUpperCase() + bo.buyerSegment.slice(1) : "—"} • {ci.city || ""}{ci.city && ci.country ? ", " : ""}{ci.country || ""}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    b.status === "submitted"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {b.status === "submitted" ? "Submitted" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-2 text-sm text-[var(--color-text-secondary)] flex-1">
                <p><b>Industry:</b> {bo.industry || "—"}</p>
                <p><b>Revenue:</b> {bo.annualRevenue || "—"}</p>
                <p><b>Employees:</b> {bo.noOfEmployees || "—"}</p>
                <p><b>Geography:</b> {bo.geographyOfOperation || "—"}</p>
                <p><b>Contact:</b> {ci.contactPerson || "—"} · {ci.mobile || "—"}</p>
                <p><b>Email:</b> {ci.email || "—"}</p>

                {/* Categories */}
                {pro.categoriesNeeded && pro.categoriesNeeded.length > 0 && (
                  <div className="pt-2 border-t border-gray-50">
                    <p className="font-medium text-xs text-gray-900 mb-1.5">Categories Needed</p>
                    <div className="flex flex-wrap gap-1">
                      {pro.categoriesNeeded.slice(0, 3).map(c => (
                        <span key={c} className="px-2 py-0.5 text-xs rounded-lg bg-green-50 text-green-700 border border-green-100">
                          {c}
                        </span>
                      ))}
                      {pro.categoriesNeeded.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-lg bg-gray-100 text-gray-500">
                          +{pro.categoriesNeeded.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-auto p-4 border-t border-[var(--color-border)] flex flex-wrap gap-2">
                <a
                  href={`/admin/buyers/${b.uid}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 mb-1"
                >
                  View Full Onboarding Profile
                </a>

                {!b.approved && (
                  <button
                    onClick={() => approveBuyer(b.uid)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-white bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))] hover:opacity-90"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </button>
                )}

                <button
                  onClick={() => rejectBuyer(b.uid)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)]"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>

                <button
                  onClick={() => deleteBuyer(b.uid)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
                  title="Delete Buyer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
