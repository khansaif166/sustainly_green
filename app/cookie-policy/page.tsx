import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <main className="bg-[var(--color-bg-soft)] px-4 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-white)] px-5 py-2.5 text-sm font-medium text-[var(--color-ocean-blue)] transition hover:bg-[var(--color-ocean-blue)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <article className="mt-10 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-8 text-sm leading-relaxed text-[var(--color-text-primary)] shadow-[0_12px_40px_rgba(0,0,0,0.08)] md:p-10">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-semibold">Cookie Policy</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Last updated: 05-Jul-2026
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. How We Use Cookies</h2>
            <p>
              Sustainly Green uses cookies and similar technologies to keep the
              platform secure, remember account sessions, support buyer and
              vendor workflows, and understand how visitors use the website.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-semibold">2. Cookie Categories</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Essential cookies:</strong> required for login, session
                security, protected dashboard access, and form submission.
              </li>
              <li>
                <strong>Preference cookies:</strong> remember interface choices
                such as selected filters or account flow state.
              </li>
              <li>
                <strong>Analytics cookies:</strong> help us measure page usage,
                errors, and marketplace journeys so we can improve the platform.
              </li>
              <li>
                <strong>Marketing cookies:</strong> may be used only where
                enabled to measure campaigns or improve relevant communications.
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-semibold">3. Managing Cookies</h2>
            <p>
              You can control cookies from your browser settings. Blocking
              essential cookies may prevent login, onboarding, RFQs, dashboards,
              and other protected marketplace features from working correctly.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-semibold">4. Contact</h2>
            <p>
              For cookie or privacy questions, contact Sustainly Ecohub India
              Pvt Ltd at <strong>grow@sustainlygreen.com</strong>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
