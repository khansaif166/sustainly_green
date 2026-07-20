import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import { ArrowRight, BadgeCheck, BookOpen, Network, SearchCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Sustainly Green SDG Commitment | The Hub of Sustainability",
  description: "Discover how Sustainly Green supports SDG 12 and SDG 13 through verified sustainable suppliers, responsible sourcing, circular economy solutions, and lower-carbon business connections.",
};

const primaryGoals = [
  {
    number: 12,
    title: "Responsible Consumption and Production",
    image: "/TheGlobalGoals_Icons_Color_Goal_12.svg",
    summary: "Helping businesses discover responsible products, circular solutions, sustainable suppliers, eco-packaging and waste-management services.",
    support: [
      "Help buyers discover more responsible products and suppliers.",
      "Promote waste reduction, recycling, reuse and recovery-oriented solutions.",
      "Encourage suppliers to showcase sustainability certifications and evidence.",
      "Improve awareness of sustainable sourcing and responsible business practices.",
    ],
    targets: ["12.2 Efficient use of natural resources", "12.5 Waste prevention, recycling and reuse", "12.6 Sustainable company practices", "12.7 Sustainable procurement", "12.8 Sustainability information and awareness"],
  },
  {
    number: 13,
    title: "Climate Action",
    image: "/TheGlobalGoals_Icons_Color_Goal_13.svg",
    summary: "Making renewable energy, energy efficiency, green building and other climate-supportive business options easier to discover and evaluate.",
    support: [
      "Improve visibility of renewable-energy and energy-efficiency solutions.",
      "Encourage more climate-conscious procurement decisions.",
      "Build awareness around lower-impact business solutions and operations.",
      "Support businesses aligning sourcing with climate and ESG priorities.",
    ],
    targets: ["13.2 Integrate climate measures into planning", "13.3 Improve climate awareness and capacity"],
  },
];

const supportingGoals = [
  [6, "Clean Water and Sanitation", "Water treatment, efficiency, wastewater and responsible resource-management visibility."],
  [7, "Affordable and Clean Energy", "Renewable-energy and energy-efficiency solutions that are easier for businesses to discover."],
  [9, "Industry, Innovation and Infrastructure", "Helping sustainable technologies and innovative green solutions reach suitable buyers."],
  [17, "Partnerships for the Goals", "Connecting vendors, buyers, sustainability professionals and supporting services in one ecosystem."],
] as const;

const hubRoles = [
  [SearchCheck, "A sourcing hub", "Buyers can discover sustainable products, suppliers and categories in one place, making responsible sourcing more efficient."],
  [BadgeCheck, "A verification and trust hub", "Certification, testing and verification pathways make sustainability positioning clearer and more credible."],
  [BookOpen, "A knowledge and ecosystem hub", "Category-led discovery and educational direction help make sustainability understandable and actionable."],
] as const;

export default function SdgCommitmentPage() {
  return (
    <><Header /><main className="sdg-page">
      <section className="sdg-hero">
        <div className="sdg-hero-copy">
          <p className="sdg-eyebrow">The Hub of Sustainability</p>
          <h1>Our SDG Commitment</h1>
          <p>Sustainly Green is building a platform that makes sustainable business solutions more visible, credible and actionable. We connect businesses with sustainable suppliers, certifications and focused categories that support responsible sourcing, circular economy thinking and lower-carbon operations.</p>
          <div className="sdg-hero-actions"><Link href="/browse">Explore sustainable solutions <ArrowRight size={16} /></Link><Link href="/about">About Sustainly Green</Link></div>
        </div>
        <div className="sdg-hero-goals">
          <Image src="/TheGlobalGoals_Icons_Color_Goal_12.svg" alt="SDG 12 Responsible Consumption and Production" width={210} height={210} priority />
          <Image src="/TheGlobalGoals_Icons_Color_Goal_13.svg" alt="SDG 13 Climate Action" width={210} height={210} priority />
        </div>
      </section>

      <section className="sdg-intro"><div><p className="sdg-eyebrow">Why this matters</p><h2>Sustainability should not be difficult to discover, compare or trust.</h2></div><p>Businesses need a practical way to find responsible vendors, understand sustainability credentials and make better purchasing decisions with confidence. Sustainly Green brings buyers, vendors, certifications and sustainability-focused categories together to make responsible business decisions easier to discover and act on.</p></section>

      <section className="sdg-section"><div className="sdg-section-head"><p className="sdg-eyebrow">Primary alignment</p><h2>The SDGs supported by Sustainly Green</h2><p>Our strongest alignment is with SDG 12 and SDG 13. We use these goals as a framework for contribution—not as a blanket certification claim.</p></div>
        <div className="sdg-primary-grid">{primaryGoals.map(goal => <article key={goal.number} className="sdg-primary-card">
          <div className="sdg-goal-heading"><Image src={goal.image} alt={`SDG ${goal.number} ${goal.title}`} width={120} height={120} /><div><p>SDG {goal.number}</p><h3>{goal.title}</h3></div></div>
          <p className="sdg-summary">{goal.summary}</p><h4>How Sustainly Green supports SDG {goal.number}</h4><ul>{goal.support.map(item => <li key={item}>{item}</li>)}</ul>
          <div className="sdg-targets"><h4>Relevant targets</h4>{goal.targets.map(target => <span key={target}>{target}</span>)}</div>
        </article>)}</div>
      </section>

      <section className="sdg-supporting"><div className="sdg-section-head"><p className="sdg-eyebrow">Supporting SDGs</p><h2>A wider sustainability ecosystem</h2></div><div className="sdg-support-grid">{supportingGoals.map(([number, title, text]) => <article key={number}><Image src={`/TheGlobalGoals_Icons_Color_Goal_${number}.svg`} alt={`SDG ${number} ${title}`} width={92} height={92} /><div><h3>SDG {number} · {title}</h3><p>{text}</p></div></article>)}</div></section>

      <section className="sdg-section"><div className="sdg-section-head"><p className="sdg-eyebrow">Our role</p><h2>More than a marketplace</h2><p>Sustainly Green is building a broader ecosystem for business discovery, supplier visibility, trust-building and sustainability awareness.</p></div><div className="sdg-role-grid">{hubRoles.map(([Icon, title, text]) => <article key={title}><div><Icon size={22} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="sdg-benefits"><div><p className="sdg-eyebrow">For buyers</p><h2>Source with greater confidence</h2><ul><li>Easier discovery of sustainability-focused vendors.</li><li>Better visibility into certifications and trust signals.</li><li>Faster access to circular economy, energy, water, waste and materials solutions.</li><li>More confidence in sustainability-linked procurement decisions.</li></ul><Link href="/register?role=BUYER">Start sourcing <ArrowRight size={15} /></Link></div><div><p className="sdg-eyebrow">For vendors</p><h2>Make responsible solutions visible</h2><ul><li>Better visibility for sustainable products and services.</li><li>Stronger differentiation through category relevance and trust positioning.</li><li>Opportunity to showcase certifications, testing and credentials.</li><li>Access to buyers interested in ESG-aligned sourcing.</li></ul><Link href="/register?role=VENDOR">List your business <ArrowRight size={15} /></Link></div></section>

      <section className="sdg-trust"><Network size={30} /><div><p className="sdg-eyebrow">Our approach to credibility</p><h2>Sustainability claims should be visible, understandable and evidence-led.</h2><p>We distinguish between supplier-declared claims, documented certifications and platform-level verification to improve transparency and reduce greenwashing risk.</p></div></section>
    </main><Footer /></>
  );
}
