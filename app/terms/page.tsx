"use client";

import { ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import Link from "next/link";

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="max-w-full mx-auto px-4 py-16 space-y-10">
       <Link
          href="/"
          className="
          inline-flex items-center gap-2
          px-5 py-2.5
          rounded-full text-sm font-medium
          bg-[var(--color-bg-white)]
          text-[var(--color-ocean-blue)]
          border border-[var(--color-border)]
          hover:bg-[var(--color-ocean-blue)]
          hover:text-white
          transition
        "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        {/* ================= HEADER ================= */}
        <section className="text-center space-y-3">
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
            TERMS AND CONDITIONS OF USE
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Terms and Conditions for Sustainly Green
          </p>
        </section>

        {/* ================= CONTENT ================= */}
        <section
          className="
          rounded-3xl bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          shadow-[0_12px_40px_rgba(0,0,0,0.08)]
          p-6 md:p-10 space-y-10
        "
        >
          <Section title="SECTION 1: INTRODUCTION">
            <p>
              Sustainly Green Ltd is a UK-registered company committed to
              accelerating the global transition to a sustainable, eco-conscious
              future. It operates as an innovative online platform connecting
              green and sustainable manufacturers, and service providers, and
              dedicated to environmental sustainability and compliance with UK
              and local laws.
            </p>

            <p className="font-medium">1.2 Scope and Acceptance of Terms</p>
            <p>
              1.2.1 By accessing, registering, or using the Sustainly Green
              platform (the "Platform"), you agree to be legally bound by these
              Terms and Conditions ("Terms"). If you do not agree, do not use
              the Platform.
            </p>
            <p>
              1.2.2 Sustainly Green reserves the right to update or revise these
              Terms at any time without prior notice. Your continued use of the
              Platform after such updates constitutes your acceptance of the
              revised Terms.
            </p>
            <p>
              1.2.3 These Terms apply to all users including but not limited to
              service providers, manufacturers, and general visitors
              (collectively, "Users").
            </p>
          </Section>

          <Section title="SECTION 2: DEFINITIONS">
            <ul className="list-disc space-y-2 pl-10">
              <li>
                <b>Sustainly Green</b> refers to Sustainly Green Ltd and its
                affiliates.
              </li>
              <li>
                <b>Platform</b> means the Sustainly Green website and services.
              </li>
              <li>
                <b>Listing</b> refers to any product, service, or advertisement
                published.
              </li>
              <li>
                <b>Sustainable Product/Service</b> aligns with sustainability
                criteria.
              </li>
              <li>
                <b>Non-Compliant Listing</b> violates legal or sustainability
                standards.
              </li>
            </ul>

            <p className="mt-3">
              Key terms: “User”, “Service Provider”, “Manufacturer”,
              “Sustainable”, Eco-Friendly items, Organic items etc.
            </p>
          </Section>

          <Section title="SECTION 3: USER ELIGIBILITY AND REGISTRATION">
            <ul className="list-disc pl-10 space-y-2">
              <li>Signup requirements</li>
              <li>Account security</li>
              <li>Accurate information policy</li>
            </ul>

            <p>3.1 You must be at least 18 years old to use the Platform.</p>
            <p>3.2 Information provided must be accurate and up to date.</p>
            <p>
              3.3 Sustainly Green may suspend or terminate access for violations
              or misleading information.
            </p>
          </Section>

          <Section title="SECTION 4: REGISTRATION AND ACCOUNTS">
            <ul className="list-disc pl-10 space-y-2">
              <li>Platform acts as a directory/listing service only</li>
              <li>No endorsement or verification of listings</li>
              <li>No liability for sustainability claims</li>
              <li>UK & international law compliance disclaimer</li>
            </ul>

            <p>4.1 Users must create an account to access features.</p>
            <p>4.2 Users are responsible for account security.</p>
            <p>4.3 Accounts are personal and non-transferable.</p>
          </Section>

          <Section title="SECTION 5: USER OBLIGATIONS">
            <ul className="list-disc pl-10 space-y-2">
              <li>Comply with UK and local laws</li>
              <li>No unlawful or misleading activity</li>
              <li>No misrepresentation of sustainability</li>
              <li>No infringement of intellectual property</li>
            </ul>
          </Section>

          <Section title="SECTION 6: LISTING CONTENT AND ACCURACY">
            <p>6.1 Listings must be accurate and truthful.</p>
            <p>6.2 Sustainly Green does not verify listing claims.</p>
            <p>6.3 Users are responsible for compliance.</p>
            <p>6.4 Misrepresentation may result in removal or legal action.</p>
          </Section>

          <Section title="SECTION 7: NO LIABILITY FOR THIRD-PARTY CONTENT">
            <p>
              Sustainly Green is not involved in production, certification, or
              distribution of listed products.
            </p>

            <ul className="list-disc pl-10 space-y-2">
              <li>Harm caused by products</li>
              <li>Mislabeling of non-sustainable items</li>
              <li>Violations of law by users</li>
            </ul>
          </Section>

          <Section title="SECTION 8: INTELLECTUAL PROPERTY">
            <p>
              Platform content belongs to Sustainly Green or licensors.
              Unauthorized use is prohibited.
            </p>
          </Section>

          <Section title="SECTION 9: DISCLAIMERS AND LIMITATION OF LIABILITY">
            <p className="font-semibold">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES.
            </p>
            <p>
              Sustainly Green is not liable for indirect or consequential
              damages, inaccurate listings, or loss of data, profit, or
              reputation.
            </p>
          </Section>

          <Section title="SECTION 10: INDEMNIFICATION">
            <p>
              Users agree to indemnify Sustainly Green from claims arising from
              misuse, violations, or legal breaches.
            </p>
          </Section>

          <Section title="SECTION 11: SUSPENSION OR TERMINATION">
            <p>
              Sustainly Green may suspend or terminate accounts at any time for
              policy violations or legal reasons.
            </p>
          </Section>

          <Section title="SECTION 12: GOVERNING LAW AND JURISDICTION">
            <p>
              Governed by the laws of England and Wales. Jurisdiction lies in
              London, United Kingdom.
            </p>
          </Section>

          <Section title="SECTION 13: DISPUTE RESOLUTION">
            <p>
              Disputes will first be resolved through negotiation, then
              mediation, followed by binding arbitration in London under the
              Arbitration Act 1996.
            </p>
          </Section>

          <Section title="SECTION 14: CONTACT AND NOTICES">
            <p>
              <b>Sustainly Green Ltd</b>
            </p>
            <p>Winchester House, 259-269 Old Marylebone Road</p>
            <p>London, NW1 5RA, United Kingdom</p>
            <p>
              Email: <b>grow@sustainlygreen.com</b>
            </p>
            <p>
              Phone: <b>+44 20 3996 1521</b>
            </p>
          </Section>

          <Section title="SECTION 15: MISCELLANEOUS">
            <p>
              These Terms constitute the entire agreement and remain enforceable
              even if certain clauses are deemed invalid.
            </p>
          </Section>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ================= REUSABLE SECTION ================= */

function Section({ title, children }: any) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}
