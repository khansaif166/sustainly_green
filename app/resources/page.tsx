import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileQuestion,
  Leaf,
  Newspaper,
  Scale,
  ShieldCheck,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";

const resources = [
  {
    title: "Sourcing Guides",
    text: "Practical advice for selecting verified sustainable products and suppliers.",
    href: "/blogs",
    icon: BookOpen,
  },
  {
    title: "Buyer FAQs",
    text: "Answers for RFQs, supplier discovery, marketplace use, and account setup.",
    href: "/help/buyers",
    icon: FileQuestion,
  },
  {
    title: "Vendor FAQs",
    text: "Guidance for listing a business, verification, product uploads, and enquiries.",
    href: "/help/vendors",
    icon: ShieldCheck,
  },
  {
    title: "Certifications",
    text: "Explore sustainability certifications and request certification support.",
    href: "/certification",
    icon: Leaf,
  },
  {
    title: "Terms",
    text: "Review the platform terms and conditions for buyers, vendors, and visitors.",
    href: "/terms",
    icon: Scale,
  },
  {
    title: "Cookie Policy",
    text: "Understand how cookies support login, preferences, analytics, and security.",
    href: "/cookie-policy",
    icon: Newspaper,
  },
];

export default function ResourcesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f7faf6] px-4 py-14">
        <div className="mx-auto w-full max-w-6xl min-w-0">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-ocean-blue)] transition hover:bg-[var(--color-ocean-blue)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <section className="mb-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-green-700">
              Resources
            </p>
            <h1 className="max-w-3xl break-words text-3xl font-semibold tracking-tight text-[#10241b] sm:text-4xl md:text-5xl">
              Guides, policies, and support for sustainable sourcing.
            </h1>
            <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-[#5d6b63]">
              Find marketplace guidance, buyer and vendor support, certification
              information, and legal policies in one place.
            </p>
          </section>

          <section className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map(({ title, text, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group min-w-0 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
                  <Icon size={20} />
                </div>
                <h2 className="break-words text-lg font-bold text-[#10241b]">{title}</h2>
                <p className="mt-2 break-words text-sm leading-6 text-[#637269]">{text}</p>
              </Link>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
