"use client";

import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import {
  BadgePercent,
  Clock,
  Leaf,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

/* ---------------- TEMP DEAL DATA ---------------- */
/* Later replace with Firestore */
const DEALS = [
  {
    id: "1",
    title: "Recycled PET Fabric for Apparel",
    discount: "20% OFF",
    expiresIn: "12 hrs",
    priceType: "Starts From",
    sustainability: "Made from 70% recycled PET",
  },
  {
    id: "2",
    title: "Biodegradable Packaging Solutions",
    discount: "15% OFF",
    expiresIn: "8 hrs",
    priceType: "Bulk Pricing",
    sustainability: "100% compostable materials",
  },
  {
    id: "3",
    title: "Solar Power Installation Services",
    discount: "Limited Offer",
    expiresIn: "24 hrs",
    priceType: "Custom Quote",
    sustainability: "Clean renewable energy",
  },
];

export default function DailyDealsPage() {
  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-14 space-y-16">
        {/* ================= HERO ================= */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)]">
            Daily Deals
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-secondary)]">
            Exclusive limited-time offers on verified sustainable products and
            services.
          </p>
        </section>

        {/* ================= DEALS GRID ================= */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEALS.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </section>

        {/* ================= CTA ================= */}
        <section className="text-center space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Looking for more sustainable options?
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-full
                       bg-[var(--color-primary-green)] text-white
                       px-6 py-2.5 text-sm font-semibold
                       hover:brightness-95 transition"
          >
            Browse Marketplace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ================= COMPONENT ================= */

function DealCard({ deal }: { deal: any }) {
  return (
    <div
      className="bg-[var(--color-bg-white)]
                 border border-[var(--color-border)]
                 rounded-2xl p-6 space-y-4
                 hover:shadow-md transition"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <BadgePercent className="h-6 w-6 text-[var(--color-primary-green)]" />

        <span className="flex items-center gap-1 text-xs font-medium
                         bg-red-100 text-red-700
                         px-2 py-1 rounded-full">
          <Clock className="h-3 w-3" />
          {deal.expiresIn}
        </span>
      </div>

      {/* TITLE */}
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2">
        {deal.title}
      </h3>

      {/* META */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-primary-green)]">
          {deal.discount}
        </p>

        <p className="text-xs text-[var(--color-text-secondary)]">
          {deal.priceType}
        </p>
      </div>

      {/* SUSTAINABILITY */}
      <div className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
        <Leaf className="h-4 w-4 text-green-600 mt-0.5" />
        <span>{deal.sustainability}</span>
      </div>

      {/* CTA */}
      <Link
        href="/browse"
        className="inline-block text-xs font-semibold
                   text-[var(--color-primary-green)]
                   hover:underline"
      >
        View Deal →
      </Link>
    </div>
  );
}
