"use client";

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import { Leaf, BadgeCheck, Eye, Globe2 } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="max-w-full mx-auto px-6 py-16 space-y-16">
        {/* ================= HERO ================= */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)]">
            About Sustainly Green
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-secondary)]">
            Building a global marketplace for sustainable products, responsible
            businesses, and conscious consumers.
          </p>
        </section>

        {/* ================= INTRO ================= */}
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Who We Are
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Sustainly Green is a sustainability-focused marketplace designed to
              connect verified eco-friendly brands with buyers who care about the
              planet. We make it easy for individuals and businesses to discover,
              compare, and source sustainable products and services from trusted
              vendors worldwide.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Our platform supports ethical sourcing, reduced environmental
              impact, and transparency—helping sustainability become a practical
              choice rather than a complicated one.
            </p>
          </div>

          <div className="bg-[var(--color-bg-soft)] rounded-3xl p-8 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Our Vision
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              To create a world where sustainable choices are accessible,
              trusted, and scalable—empowering businesses and consumers to
              contribute to a greener future.
            </p>
          </div>
        </section>

        {/* ================= VALUES ================= */}
        <section className="space-y-8">
          <h2 className="text-xl font-semibold text-center text-[var(--color-text-primary)]">
            What We Stand For
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ValueCard
              icon={<Leaf className="h-6 w-6 text-[var(--color-primary-green)]" />}
              title="Sustainability First"
              description="We prioritise products and services that reduce environmental impact and support long-term ecological balance."
            />

            <ValueCard
              icon={<BadgeCheck className="h-6 w-6 text-[var(--color-ocean-blue)]" />}
              title="Verified Vendors"
              description="Every vendor goes through an approval process to ensure credibility, quality, and ethical practices."
            />

            <ValueCard
              icon={<Eye className="h-6 w-6 text-[var(--color-solar-yellow)]" />}
              title="Transparency"
              description="Clear information, honest pricing, and sustainability claims that buyers can trust."
            />

            <ValueCard
              icon={<Globe2 className="h-6 w-6 text-[var(--color-primary-green)]" />}
              title="Global Impact"
              description="Connecting sustainable businesses and buyers across regions to scale positive change worldwide."
            />
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="text-center space-y-5">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Join the Sustainable Economy
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Whether you’re a buyer looking for responsible products or a vendor
            offering sustainable solutions, Sustainly Green is built for you.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-[var(--color-primary-green)] text-white px-6 py-2 text-sm font-medium hover:brightness-95 transition"
            >
              Create Account
            </Link>
            <Link
              href="/browse"
              className="rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)] px-6 py-2 text-sm font-medium hover:bg-[var(--color-bg-soft)] transition"
            >
              Browse Marketplace
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ================= VALUE CARD ================= */

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-2xl p-6 space-y-3 shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition hover:-translate-y-1">
      <div className="h-12 w-12 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
