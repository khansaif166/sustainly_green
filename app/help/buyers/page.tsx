import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import { ArrowLeft } from "lucide-react";

const faqs = [
  ["How do I submit an RFQ?", "Create a buyer account, open Submit RFQ, describe the product or service required, add quantity and delivery details, and submit the request."],
  ["How do I find suitable vendors?", "Use Browse Marketplace to filter vendors by category, location and verification status, then open a vendor profile to review its information."],
  ["Can I compare vendor quotations?", "Yes. Submitted quotations remain associated with your RFQ so you can review supplier responses before continuing."],
  ["What does a claimed vendor mean?", "A claimed vendor profile is managed by the business associated with that listing. Verification badges are shown separately when applicable."],
  ["Where can I track my RFQs?", "Sign in to the Buyer Dashboard and open My RFQs to view requests, status updates and vendor responses."],
];

export default function BuyerFaqPage() {
  return <><Header /><main className="faq-page"><div className="faq-shell">
    <Link href="/resources" className="faq-back"><ArrowLeft size={15} />Resources</Link>
    <p className="faq-kicker">Buyer support</p><h1>Buyer FAQs</h1>
    <p className="faq-intro">Answers about sourcing, vendors, quotations and buyer marketplace workflows.</p>
    <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    <div className="faq-help">Need more help? <Link href="/help">Contact the support team</Link>.</div>
  </div></main><Footer /></>;
}
