import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
    <Header />
    <main className="bg-[var(--color-bg-soft)] py-16 px-4">
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
      <section className="max-w-full mx-auto ">

        {/* ================= HEADER ================= */}
        <header className="text-center mb-19">
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
            Sustainly Green — Privacy Policy
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            Last updated: 12-Jan-2026
          </p>
        </header>

        {/* ================= CONTENT CARD ================= */}
        <article
          className="
            rounded-3xl
            bg-[var(--color-bg-white)]
            border border-[var(--color-border)]
            shadow-[0_12px_40px_rgba(0,0,0,0.08)]
            p-8 md:p-10
            space-y-8
            text-sm mt-10
            leading-relaxed
            text-[var(--color-text-primary)]
          "
        >

          {/* ========== SECTION 1 ========== */}
          <section>
            <h2 className="font-semibold text-lg mb-2">
              1) Who we are (the “controller”)
            </h2>

            <p>
              Sustainly Green (“Sustainly Green”, “we”, “our”, “us”) operates
              an online sustainable sourcing platform and directory connecting
              sustainability-focused manufacturers, Traders, Wholesalers,
              Distributors and service providers, and users worldwide. For the
              personal data we collect about you on our Platform, we act as data
              controller.
            </p>

            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>
                <strong>Contact (privacy):</strong> grow@sustainlygreen.com
              </li>
              <li>
                <strong>Data Protection Lead (DPL):</strong> same email — please put
                “ATTN: DPL” in the subject.
              </li>
            </ul>

            <p className="mt-3">
              Vendors and service providers listing on Sustainly Green act as
              independent controllers for the personal data they collect from you
              directly (e.g., via their websites, forms, or contracts). They must
              publish their own privacy notices.
            </p>
          </section>

          {/* ========== SECTION 2 ========== */}
          <section>
            <h2 className="font-semibold text-lg mb-2">
              2) What we collect (data categories)
            </h2>

            <p>
              We operate on data minimization principles. We collect only what we
              need to deliver the service and maintain trust.
            </p>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Account & Identity:</strong> name, email, password hash, role (general user, vendor, manufacturer), company details.</li>
              <li><strong>Profile & Listings:</strong> business profile, logos, descriptions, sustainability claims/certifications you choose to publish.</li>
              <li><strong>Engagement & Communications:</strong> messages you send via the Platform, support requests, survey responses.</li>
              <li><strong>Commercial:</strong> subscription tier, invoices, payment status (handled by payment processors; we don’t store full card data).</li>
              <li><strong>Device & Usage:</strong> IP address, device/browser metadata, timestamps, pages/actions, crash logs.</li>
              <li><strong>Cookies & Similar Tech:</strong> identifiers to keep you logged in, remember preferences, measure analytics, and (if enabled) run marketing/retargeting.</li>
              <li><strong>Location (coarse):</strong> derived from IP to localize content and detect fraud.</li>
              <li><strong>Sensitive data:</strong> we do not intentionally collect special categories (e.g., health, religion). If uploaded inadvertently, we delete or restrict it.</li>
            </ul>
          </section>

          {/* ========== SECTION 3 ========== */}
          <section>
            <h2 className="font-semibold text-lg mb-2">
              3) Where we get it (sources)
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Directly from you (registration, forms, messages, uploads).</li>
              <li>Automatically through the Platform (logs, cookies).</li>
              <li>From third parties you connect (payment processors, single sign-on providers, analytics).</li>
            </ul>
          </section>

          {/* ========== SECTION 4 ========== */}
          <section>
            <h2 className="font-semibold text-lg mb-2">
              4) Why we process it (purposes & lawful bases)
            </h2>

            <p>
              We process personal data to deliver accounts, publish vendor listings,
              handle payments, provide customer support, ensure platform security,
              improve product performance, conduct optional marketing (with
              consent), and comply with legal obligations.
            </p>

            <p className="mt-3">
              We do not make decisions with legal or similarly significant effects
              based solely on automated processing. We do use automated systems
              (including AI) for spam, fraud, greenwashing detection and content
              moderation with human-in-the-loop review.
            </p>
          </section>

          {/* ========== SECTION 5 ========== */}
          <section>
            <h2 className="font-semibold text-lg mb-2">
              5) Marketplace roles — who is responsible for what
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Sustainly Green is controller for Platform operations (accounts, security, analytics, messaging relay).</li>
              <li>Vendors/Manufacturers are independent controllers for the data they collect in their own funnels and for sustainability claims.</li>
            </ul>
          </section>

          {/* ========== SECTION 6–16 (SHORTENED NOTE) ========== */}
          <section>
            <h2 className="font-semibold text-lg mb-2">
              6) Sharing, Transfers, Retention, Rights, Security & Contact
            </h2>

            <p>
              Sections 6 through 16 of this Privacy Policy cover data sharing,
              international transfers, retention periods, user rights, children,
              cookies, security practices, sustainability-by-design, third-party
              links, policy updates, and contact details.
            </p>

            <p className="mt-2">
              For privacy requests, questions, or complaints, contact:
              <br />
              <strong>Email:</strong> grow@sustainlygreen.com
            </p>

            <p className="mt-2">
              We aim to respond within 30 days for rights requests, faster for
              security and abuse reports.
            </p>
          </section>

        </article>
      </section>
    </main>
    <Footer />
    </>
  );
}
