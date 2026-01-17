"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";

/* ================= TYPES ================= */

type Vendor = {
  uid: string;
  company: string;
  registrationNumber?: string;
  businessType: string;
  primaryCategory?: string;
  country: string;
  city: string;

  businessEmail?: string;
  businessPhone?: string;

  hasCertifications?: boolean;
  certificationNames?: string[];
  certificates?: string[];

  description?: string;
  yearEstablished?: number;
  website?: string;

  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };

  approved: boolean;
};

/* ================= PAGE ================= */

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");

  /* ================= LOAD ================= */

  async function fetchVendors() {
    const snap = await getDocs(collection(db, "vendors"));
    setVendors(snap.docs.map((d) => d.data() as Vendor));
    setLoading(false);
  }

  useEffect(() => {
    fetchVendors();
  }, []);

  /* ================= ACTIONS ================= */

  async function approveVendor(uid: string) {
    await updateDoc(doc(db, "vendors", uid), { approved: true });
    await updateDoc(doc(db, "users", uid), { vendorApproved: true });
    fetchVendors();
  }

  async function rejectVendor(uid: string) {
    await updateDoc(doc(db, "vendors", uid), { approved: false });
    fetchVendors();
  }

  /* ================= FILTER ================= */

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        v.company?.toLowerCase().includes(search.toLowerCase()) ||
        v.businessEmail?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        status === "ALL" ||
        (status === "APPROVED" && v.approved) ||
        (status === "PENDING" && !v.approved);

      return matchSearch && matchStatus;
    });
  }, [vendors, search, status]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-[var(--color-text-secondary)]">
        Loading vendors…
      </div>
    );
  }

  return (
    <main className="max-w-full mx-auto space-y-8">

      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Vendor Approvals
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Review and approve vendor registrations
        </p>
      </section>

      {/* ================= FILTER BAR ================= */}
      <section
        className="
          rounded-2xl
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          p-4
          flex flex-col md:flex-row gap-4
        "
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or email"
            className="
              w-full rounded-xl
              border border-[var(--color-border)]
              pl-9 pr-3 py-2.5 text-sm
              bg-[var(--color-bg-white)]
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--color-ocean-blue)]/30
            "
          />
        </div>

        {/* Status */}
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="
              w-full rounded-xl
              border border-[var(--color-border)]
              pl-9 pr-3 py-2.5 text-sm
              bg-[var(--color-bg-white)]
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--color-ocean-blue)]/30
            "
          >
            <option value="ALL">All Vendors</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </section>

      {/* ================= GRID ================= */}
      {filteredVendors.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No vendor registrations found.
        </p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((v) => (
          <div
            key={v.uid}
            className="
              rounded-3xl
              bg-[var(--color-bg-white)]
              border border-[var(--color-border)]
              shadow-[0_10px_30px_rgba(0,0,0,0.06)]
              flex flex-col
            "
          >
            {/* HEADER */}
            <div
              className="p-5 rounded-t-3xl"
              style={{
                background: v.approved
                  ? "var(--gradient-brand-soft)"
                  : "transparent",
              }}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="font-semibold text-[var(--color-text-primary)]">
                    {v.company}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {v.businessType} • {v.city}, {v.country}
                  </p>
                </div>

                <StatusBadge approved={v.approved} />
              </div>
            </div>

            {/* BODY */}
            <div className="p-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <p><b>Category:</b> {v.primaryCategory || "—"}</p>
              <p><b>Established:</b> {v.yearEstablished || "—"}</p>

              {v.website && (
                <a
                  href={v.website}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-ocean-blue)] hover:underline"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {v.description && (
                <p className="line-clamp-3">{v.description}</p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="mt-auto p-4 border-t border-[var(--color-border)] flex gap-2">
              {!v.approved && (
                <button
                  onClick={() => approveVendor(v.uid)}
                  className="
                    flex-1 inline-flex items-center justify-center gap-2
                    px-4 py-2 rounded-full text-xs font-medium
                    text-white
                    bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
                    hover:opacity-90
                  "
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              )}

              <button
                onClick={() => rejectVendor(v.uid)}
                className="
                  flex-1 inline-flex items-center justify-center gap-2
                  px-4 py-2 rounded-full text-xs font-medium
                  border border-[var(--color-border)]
                  text-[var(--color-text-secondary)]
                  hover:bg-[var(--color-bg-soft)]
                "
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

/* ================= UI ================= */

function StatusBadge({ approved }: { approved: boolean }) {
  return (
    <span
      className={`
        px-3 py-1 rounded-full text-xs font-semibold
        ${
          approved
            ? "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]"
            : "bg-[var(--color-solar-yellow)]/25 text-[var(--color-solar-yellow)]"
        }
      `}
    >
      {approved ? "Approved" : "Pending"}
    </span>
  );
}
