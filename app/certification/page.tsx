"use client";

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";

export default function CertificationPage() {
  return (
    <>
    <Header/>
    <main className="min-h-screen bg-gray-50">

      {/* ================= HERO ================= */}
      <section className="text-center py-16 px-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)]">
          Certification, Testing & Verification
        </h1>

        <p className="mt-3 text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Build buyer trust. Eliminate greenwashing. Unlock enterprise deals.
        </p>
      </section>

      {/* ================= TWO FLOWS ================= */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-1 gap-8 px-6">

        {/* ---------- VENDOR ---------- */}
        <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition mx-auto">
          
          <h2 className="text-xl font-semibold mb-3">
            Get Certified
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Find the right certification, manage renewals,
            and stay verified for buyers.
          </p>

          <Link
            href="/certification/request"
            className="
              inline-flex justify-center w-full
              rounded-full py-3 text-white font-semibold
              bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
              hover:brightness-95 transition
            "
          >
            Get Certification
          </Link>
        </div>

        {/* ---------- CERTIFICATION BODY ---------- */}
        {/* <div className="bg-white rounded-3xl border p-8 shadow-sm hover:shadow-lg transition">

          <h2 className="text-xl font-semibold mb-3">
            Partner as Certification Body (CB)
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Connect with certification-ready businesses and
            support certification & renewal engagements.
          </p>

          <Link
            href="/register?role=CB"
            className="
              inline-flex justify-center w-full
              rounded-full py-3 text-white font-semibold
              bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
              hover:brightness-95 transition
            "
          >
            Partner With Us
          </Link>
        </div> */}
      </section>

      {/* ================= SUPPORT CTA ================= */}
      <section className="max-w-4xl mx-auto mt-16 mb-20 px-6">
        <div className="
          rounded-3xl text-center p-10
          bg-gradient-to-r
          from-[var(--color-primary-green)]
          to-[var(--color-ocean-blue)]
          text-white
        ">
          <h3 className="text-2xl font-semibold">
            Ready to get certified and trusted by buyers?
          </h3>

          <div className="flex flex-wrap justify-center gap-4 mt-6">

            <Link
              href="/contact"
              className="bg-white text-black px-6 py-2.5 rounded-full font-medium"
            >
              Get Certification Support
            </Link>

            <a
              href="https://wa.me/919003991874"
              target="_blank"
              className="border border-white px-6 py-2.5 rounded-full"
            >
              Talk to Us
            </a>

          </div>
        </div>
      </section>

    </main>
    <Footer/>
    </>
  );
}