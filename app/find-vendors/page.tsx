"use client";

import { useEffect, useState } from "react";
import { fetchApprovedVendors, type PublicVendor } from "@/lib/supabasePublic";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import Link from "next/link";
import { Search, BadgeCheck, Clock } from "lucide-react";
import { getVendorBadgeMeta } from "@/lib/vendorBadges";

/* ---------------- TYPES ---------------- */
type Vendor = PublicVendor & { name?: string };

/* ================= PAGE ================= */
export default function FindVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD VENDORS ---------------- */
  useEffect(() => {
    async function loadVendors() {
      setLoading(true);
      try {
        setVendors(await fetchApprovedVendors());
      } catch (error) {
        console.error("Failed to load Supabase vendors", error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    }

    loadVendors();
  }, []);

  const filtered = vendors.filter((v) => {
  const query = search.toLowerCase();

  const companyName = (v.companyName || "").toLowerCase();
  const description = (v.description || "").toLowerCase();
  const name = (v.name || "").toLowerCase();

  return (
    companyName.includes(query) ||
    description.includes(query) ||
    name.includes(query)
  );
});


  return (
    <>
      <Header />

      <main className="max-w-full mx-auto px-6 py-12 space-y-8">
        {/* ================= HEADER ================= */}
        <section className="text-center space-y-3">
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
            Find Vendors
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Discover sustainable vendors and verified suppliers worldwide
          </p>
        </section>

        {/* ================= SEARCH ================= */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            placeholder="Search vendors by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary-green)]"
          />
        </div>

        {/* ================= RESULTS ================= */}
        {loading ? (
          <p className="text-sm text-center text-[var(--color-text-muted)]">
            Loading vendors…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center text-[var(--color-text-muted)]">
            No vendors found.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((v) => (
              <Link
                key={v.id}
                href={`/find-vendors/${v.id}`}
                className="bg-[var(--color-bg-white)] rounded-2xl p-6 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition"
              >
                {/* HEADER */}
                <div className="flex items-start justify-between">
                  {/* LOGO */}
                  <div className="h-14 w-14 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center overflow-hidden shrink-0">
                    {v.logoUrl ? (
                      <img
                        src={v.logoUrl}
                        alt={v.companyName || "Vendor"}
                        className="h-full w-full object-cover bg-white"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-bold text-xl text-[var(--color-text-secondary)] uppercase bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
                        {v.companyName ? v.companyName.charAt(0) : "V"}
                      </div>
                    )}
                  </div>

                  {/* BADGE */}
                  {v.isUnclaimed ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      Listed
                    </span>
                  ) : v.approved ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>

                {/* NAME */}
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">
                  {v.companyName || "Unnamed Vendor"}
                </h3>

                {getVendorBadgeMeta(v) && (
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    <img
                      src={getVendorBadgeMeta(v)?.src}
                      alt=""
                      className="h-5 w-4 rounded-[4px] object-cover"
                    />
                    {getVendorBadgeMeta(v)?.label}
                  </span>
                )}

                {/* DESC */}
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">
                  {v.description || "Sustainable business listed on Sustainly"}
                </p>

                {/* CTA */}
                <span className="inline-block text-xs font-medium text-[var(--color-primary-green)]">
                  {v.isUnclaimed ? "View Listing →" : "View Vendor →"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
