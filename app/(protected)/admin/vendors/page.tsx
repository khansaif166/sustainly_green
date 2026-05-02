"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Trash2,
} from "lucide-react";

/* ================= TYPES ================= */

type Vendor = {
  website: string | undefined;
  uid: string;
  companyName: string;
  registrationType?: string;
  cinRegistration?: string;
  gstNumber?: string;
  yearOfIncorporation?: string;
  
  businessType?: string;
  primaryCategory?: string;
  subCategories?: string[];
  
  country: string;
  city: string;
  state?: string;
  pinCode?: string;

  businessEmail?: string;
  whatsapp?: string;
  primaryContactName?: string;
  designation?: string;

  primarySustainabilityCert?: string;
  issuingBody?: string;
  certificateFileUrl?: string;

  shortDescription?: string;
  annualTurnover?: string;
  noOfEmployees?: string;

  logoUrl?: string;
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

  async function deleteVendor(uid: string) {
    if (confirm("Are you sure you want to delete this vendor? This will remove their business profile completely.")) {
      await deleteDoc(doc(db, "vendors", uid));
      fetchVendors();
    }
  }

  /* ================= FILTER ================= */

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
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
                <div className="flex items-center gap-3">
                  {v.logoUrl ? (
                    <img src={v.logoUrl} alt={v.companyName} className="w-10 h-10 rounded-full object-cover bg-white border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)] flex items-center justify-center font-bold text-lg border border-gray-300 shrink-0 uppercase">
                      {v.companyName ? v.companyName.charAt(0) : "?"}
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-[var(--color-text-primary)]">
                      {v.companyName}
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {v.businessType} • {v.city}, {v.country}
                    </p>
                  </div>
                </div>

                <StatusBadge approved={v.approved} />
              </div>
            </div>

            {/* BODY */}
            <div className="p-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <p>
                <b>Category:</b> {v.primaryCategory || "—"}
              </p>
              <p>
                <b>Established:</b> {v.yearOfIncorporation || "—"}
              </p>
              <p>
                <b>CIN:</b> {v.cinRegistration || "—"}
              </p>
              <p>
                <b>GST:</b> {v.gstNumber || "—"}
              </p>
              <p>
                <b>Contact:</b> {v.whatsapp || "—"}
              </p>
              <p>
                <b>Turnover:</b> {v.annualTurnover || "—"}
              </p>

              {/* Sustainability Cert */}
              {v.primarySustainabilityCert ? (
                <div className="pt-2 border-t border-gray-50">
                  <p className="font-medium text-xs mb-1 text-gray-900">Sustainability Certificate</p>
                  <div className="flex flex-col gap-2">
                    <span className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 border border-green-100 self-start">
                      {v.primarySustainabilityCert}
                    </span>
                    {v.certificateFileUrl && (
                      <a
                        href={v.certificateFileUrl}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> View Document
                      </a>
                    )}
                  </div>
                </div>
              ) : null}

              {v.website && (
                <a
                  href={v.website}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-ocean-blue)] hover:underline"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {v.shortDescription && <p className="line-clamp-3 italic text-xs">{v.shortDescription}</p>}
            </div>

            {/* ACTIONS */}
            <div className="mt-auto p-4 border-t border-[var(--color-border)] flex flex-wrap gap-2">
              <a
                href={`/admin/vendors/${v.uid}`}
                className="
                  w-full inline-flex items-center justify-center gap-2
                  px-4 py-2 rounded-full text-xs font-medium
                  bg-gray-100 text-gray-800 hover:bg-gray-200 mb-1
                "
              >
                View Full Onboarding Profile
              </a>

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

              <button
                onClick={() => deleteVendor(v.uid)}
                className="
                  inline-flex items-center justify-center
                  w-10 h-10 rounded-full
                  bg-red-50 text-red-600 hover:bg-red-100
                  transition-colors border border-red-100
                "
                title="Delete Vendor"
              >
                <Trash2 className="h-4 w-4" />
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
