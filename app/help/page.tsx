"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import {
  Mail,
  Phone,
  MapPin,
  LifeBuoy,
  Building2,
  User,
} from "lucide-react";

export default function HelpContactPage() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // later connect to Firestore / API
    setTimeout(() => {
      alert("Your message has been sent. Our team will contact you shortly.");
      setLoading(false);
    }, 800);
  }

  return (
    <>
      <Header />

      <main className="max-w-full mx-auto px-6 py-14 space-y-16">
        {/* ================= HERO ================= */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)]">
            Help & Contact
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-secondary)]">
            Need assistance or have a question? Our team is here to help buyers
            and vendors every step of the way.
          </p>
        </section>

        {/* ================= SUPPORT TYPES ================= */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SupportCard
            icon={User}
            title="Buyer Support"
            desc="Help with RFQs, quotes, vendor communication, and account access."
          />
          <SupportCard
            icon={Building2}
            title="Vendor Support"
            desc="Onboarding help, product listings, approvals, and profile updates."
          />
          <SupportCard
            icon={LifeBuoy}
            title="General Enquiries"
            desc="Partnerships, feedback, platform questions, or technical issues."
          />
        </section>

        {/* ================= CONTACT FORM + INFO ================= */}
        <section className="grid lg:grid-cols-2 gap-12 items-start">
          {/* FORM */}
          <div className="bg-[var(--color-bg-white)] rounded-3xl border border-[var(--color-border)] p-8">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
              Send us a message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Full name"
                  className="input"
                />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  className="input"
                />
              </div>

              <select required className="input">
                <option value="">Select enquiry type</option>
                <option>Buyer support</option>
                <option>Vendor support</option>
                <option>General enquiry</option>
              </select>

              <textarea
                required
                rows={4}
                placeholder="Describe your query..."
                className="input resize-none"
              />

              <button
                disabled={loading}
                className="rounded-full bg-[var(--color-primary-green)] text-white px-6 py-2.5 text-sm font-semibold hover:brightness-95 transition disabled:opacity-60"
              >
                {loading ? "Sending..." : "Submit message"}
              </button>
            </form>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-6">
            <div className="bg-[var(--color-bg-soft)] rounded-3xl p-8 space-y-5">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Contact details
              </h3>

              <ContactRow
                icon={Mail}
                label="Email"
                value="support@sustainlygreen.com"
              />

              <ContactRow
                icon={Phone}
                label="Phone"
                value="+44 20 3996 1521"
              />

              <ContactRow
                icon={MapPin}
                label="Office"
                value="Winchester House, 259–269 Old Marylebone Road, London NW1 5RA, United Kingdom"
              />
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              We typically respond within 24–48 business hours.
            </p>
          </div>
        </section>
      </main>

      <Footer />

      {/* ================= GLOBAL STYLES ================= */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
          background: white;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-primary-green);
          box-shadow: 0 0 0 2px rgba(11, 110, 79, 0.15);
        }
      `}</style>
    </>
  );
}

/* ================= SMALL COMPONENTS ================= */

function SupportCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-2xl border border-[var(--color-border)] p-6 space-y-3 hover:shadow-sm transition">
      <Icon className="h-6 w-6 text-[var(--color-primary-green)]" />
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {desc}
      </p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 items-start text-sm">
      <Icon className="h-4 w-4 mt-1 text-[var(--color-primary-green)]" />
      <div>
        <p className="font-medium text-[var(--color-text-primary)]">
          {label}
        </p>
        <p className="text-[var(--color-text-secondary)]">
          {value}
        </p>
      </div>
    </div>
  );
}
