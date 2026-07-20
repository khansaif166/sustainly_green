import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import { ArrowLeft } from "lucide-react";

const faqs = [
  ["How do I list my business?", "Register as a vendor and complete the onboarding steps with company, category, sustainability and marketplace information."],
  ["How do categories and subcategories work?", "Choose the primary category that best represents your business, then select up to three relevant subcategories."],
  ["Can I edit my vendor information later?", "Yes. Open Profile in the Vendor Panel to review and update the available business and marketplace fields."],
  ["Where can I manage products and enquiries?", "Use Products to create and update listings, and Enquiries to view buyer RFQs and respond with quotation details."],
  ["What is the difference between claimed and verified?", "Claimed indicates that a business manages its listing. Verification is a separate review and badge process managed by Sustainly Green."],
];

export default function VendorFaqPage() {
  return <><Header /><main className="faq-page"><div className="faq-shell">
    <Link href="/resources" className="faq-back"><ArrowLeft size={15} />Resources</Link>
    <p className="faq-kicker">Vendor support</p><h1>Vendor FAQs</h1>
    <p className="faq-intro">Answers about onboarding, listings, verification and vendor marketplace workflows.</p>
    <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    <div className="faq-help">Need more help? <Link href="/help">Contact the support team</Link>.</div>
  </div></main><Footer /></>;
}
