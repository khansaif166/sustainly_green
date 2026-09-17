'use client';

import Head from "next/head";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  LineChart,
  HelpCircle,
  FileSpreadsheet,
  Database,
  Search,
  AlertOctagon
} from "lucide-react";

// Curated high-quality Unsplash imagery for the bento grid pain points
const painPoints = [
  {
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    title: "40% to 60% Effort on Collection",
    text: "The majority of total ESG reporting effort is consumed by data collection alone: chasing suppliers and reconciling mismatched formats.",
    span: "col-span-1 md:col-span-2 row-span-2" // Large card
  },
  {
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    title: "70-80% Time Spent Finding Data",
    text: "Independent research shows 70-80% of carbon accounting goes into simply finding and cleaning data—leaving no time for analysis.",
    span: "col-span-1 row-span-1"
  },
  {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    title: "Spreadsheet Dependency",
    text: "Most companies still manage ESG data through isolated spreadsheets, making the process slow and error-prone.",
    span: "col-span-1 row-span-1"
  },
  {
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    title: "Estimation Over Measurement",
    text: "A significant share of ESG data in circulation is partially estimated rather than measured, weakening report accuracy.",
    span: "col-span-1 md:col-span-2 row-span-1" // Wide card
  },
  {
    image: "https://images.unsplash.com/photo-1604594849809-dfedbc827105?auto=format&fit=crop&w=600&q=80",
    title: "Compounding Risk",
    text: "One inaccurate data point at the source compounds through the entire report, creating downstream audit risk.",
    span: "col-span-1 row-span-1"
  }
];

const solutionPoints = [
  "Up to 40% reduction in time and cost spent on manual, repetitive ESG and carbon data work.",
  "Structured data collection, validation and follow-up so figures are accurate before they ever reach your report.",
  "One coordinated desk across data, suppliers, evidence, carbon (Scope 1/2/3), disclosures and audit readiness.",
  "Faster turnaround on supplier questionnaires, EcoVadis/BRSR/CDP submissions and investor ESG requests.",
  "Fewer errors, fewer re-submissions, fewer last-minute audit scrambles."
];

const targetAudience = [
  {
    icon: FileSpreadsheet,
    text: "Companies preparing BRSR, GRI, ESRS, CDP, SBTi or EcoVadis submissions."
  },
  {
    icon: Users,
    text: "Sustainability and finance teams drowning in supplier follow-ups and spreadsheet reconciliation."
  },
  {
    icon: Building2,
    text: "Businesses that need audit-ready evidence without expanding headcount."
  },
  {
    icon: LineChart,
    text: "ESG consulting firms that need reliable execution capacity behind their advisory work."
  }
];

const faqs = [
  {
    q: "How much time can a company save by outsourcing ESG data management?",
    a: "Organizations that shift repetitive ESG and carbon data tasks to a dedicated delivery desk typically save around 40% of the time and cost otherwise spent on manual collection, validation and reporting work."
  },
  {
    q: "Why is ESG data management so error-prone when done manually?",
    a: "Manual ESG processes rely on spreadsheets, emails and multiple data owners with no single validation layer, so small entry errors or missing data points often go unnoticed until they surface in the final report or during an audit."
  },
  {
    q: "Does Sustainly Green replace our ESG consultant or auditor?",
    a: "No. Sustainly Green supports the data, evidence and documentation work behind ESG processes. Strategic decisions, assurance and certification remain with your consultants, auditors and accredited bodies."
  },
  {
    q: "What ESG frameworks does the Delivery Desk support?",
    a: "Data and evidence support spans BRSR, GRI, ESRS, IFRS/ISSB, TCFD, SASB, CDP and SBTi-related submissions, along with EcoVadis and customer/investor ESG questionnaires."
  },
  {
    q: "Is this service only for large enterprises?",
    a: "No. The Delivery Desk model is built to flex from a single supplier questionnaire to a full recurring ESG data operation, so SMEs and large companies can both use it."
  }
];

export default function EsgDeliveryDeskPage() {
  return (
    <>
      <Head>
        <title>ESG Delivery Desk | Cut ESG Data Costs by 40% | Sustainly Green</title>
        <meta
          name="description"
          content="Stop losing time and money on manual ESG & carbon data work. Sustainly Green's ESG Delivery Desk saves up to 40% of time, cost and errors fully compliant."
        />
      </Head>

      <Header />
      <main className="esg-page">

        {/* ===== ANIMATED HERO ===== */}
        <section className="esg-hero">
          <div className="esg-hero-bg-glow"></div>
          <div className="esg-container hero-container">
            <div className="esg-hero-copy">
              <span className="esg-badge-animated">Your ESG Back Office</span>
              <h1 className="esg-gradient-text">We Don't Compromise on Compliance. We Eliminate ESG Backlog.</h1>
              <p className="esg-subtitle">Delivered as a Desk, Not a Headache.</p>
              <p className="esg-hero-desc">
                Data → Suppliers → Evidence → Carbon → Disclosures → Reporting → Readiness. One delivery desk handles the manual grind so your team focuses on decisions, not data entry.
              </p>
              <div className="esg-hero-actions">
                <Link href="/contact?subject=esg-audit" className="esg-btn-primary">
                  Book a Free ESG Data Audit <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                <a href="#how-it-works" className="esg-btn-secondary">
                  See How it Works
                </a>
              </div>
            </div>
            
            <div className="esg-hero-visual">
              {/* Floating UI Elements instead of SDG icons */}
              <div className="esg-floating-card card-1">
                <Database size={32} className="text-emerald-500 mb-2" />
                <div className="font-bold text-slate-800">Data Consolidated</div>
                <div className="text-xs text-slate-500">Spreadsheets eliminated</div>
              </div>
              <div className="esg-floating-card card-2">
                <ShieldCheck size={32} className="text-blue-500 mb-2" />
                <div className="font-bold text-slate-800">Audit Ready</div>
                <div className="text-xs text-slate-500">100% trace-verified</div>
              </div>
              <div className="esg-floating-card card-3">
                <Search size={32} className="text-orange-500 mb-2" />
                <div className="font-bold text-slate-800">Supplier Chasing</div>
                <div className="text-xs text-slate-500">Automated & resolved</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== THE PAIN (BENTO GRID) ===== */}
        <section className="esg-section bg-gray">
          <div className="esg-container">
            <div className="esg-section-head center">
              <span className="esg-eyebrow">The Cost of Manual Reporting</span>
              <h2>Why Does ESG Data Management Cost So Much and Still Go Wrong?</h2>
              <p>
                Across industries, ESG and carbon reporting is still run on spreadsheets, emails and manual follow-ups—and it shows. The real cost isn't just the man-hours. It's the compliance risk and the credibility damage.
              </p>
            </div>
            
            <div className="esg-bento-grid">
              {painPoints.map((point, idx) => (
                <article key={idx} className={`bento-image-card group ${point.span}`}>
                  <div className="bento-bg-image" style={{ backgroundImage: `url(${point.image})` }}></div>
                  <div className="bento-overlay"></div>
                  <div className="bento-content">
                    <AlertOctagon size={24} className="mb-3 text-emerald-400 opacity-80" />
                    <h3>{point.title}</h3>
                    <p>{point.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== THE SOLUTION ===== */}
        <section id="how-it-works" className="esg-section">
          <div className="esg-container">
            <div className="esg-solution-grid">
              <div className="esg-solution-copy">
                <span className="esg-eyebrow-dark">The Solution</span>
                <h2>How Sustainly Green's ESG Delivery Desk Fixes This</h2>
                <p>
                  We built a single execution layer that sits behind your ESG, sustainability or finance team and handles the repetitive, error-prone back-office work—without you having to hire, train or manage an internal data team.
                </p>
                <ul className="esg-solution-list">
                  {solutionPoints.map((point, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={24} className="esg-check-icon" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="esg-solution-visual">
                <div className="esg-stat-box group">
                  <div className="stat-glow"></div>
                  <span className="esg-stat-number group-hover:scale-105 transition-transform duration-500">40%</span>
                  <span className="esg-stat-text">Reduction in time and cost spent on manual, repetitive ESG and carbon data work.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== WHO THIS IS FOR ===== */}
        <section className="esg-section bg-gray">
          <div className="esg-container">
            <div className="esg-section-head center">
              <span className="esg-eyebrow">Target Audience</span>
              <h2>Who This Is For</h2>
            </div>
            <div className="esg-audience-grid">
              {targetAudience.map((item, idx) => (
                <div key={idx} className="bento-card group">
                  <div className="support-icon-wrap group-hover:-translate-y-2 transition-transform duration-300">
                    <item.icon size={32} />
                  </div>
                  <div className="support-text">
                    <p className="font-semibold text-lg">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TRUST BANNER ===== */}
        <section className="esg-trust-banner">
          <div className="esg-container trust-container">
            <ShieldCheck size={64} className="trust-icon" />
            <div className="trust-text">
              <span className="esg-eyebrow-light">Independent Execution Partner</span>
              <h2>Compliance stays real, because the data behind it is real.</h2>
              <p>Sustainly Green is an independent ESG execution and support partner. We manage the data, documentation and coordination behind your ESG process—we do not issue certifications or provide assurance opinions.</p>
            </div>
          </div>
        </section>

        {/* ===== FAQ BLOCK ===== */}
        <section className="esg-section">
          <div className="esg-container">
            <div className="esg-section-head center">
              <span className="esg-eyebrow-dark">FAQ</span>
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="esg-faq-list">
              {faqs.map((faq, idx) => (
                <details key={idx} className="esg-faq-item group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <summary itemProp="name">
                    <span className="esg-faq-q-text">{faq.q}</span>
                    <HelpCircle size={20} className="esg-faq-toggle group-open:rotate-180 transition-transform duration-300" />
                  </summary>
                  <div className="esg-faq-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CLOSING CTA ===== */}
        <section className="esg-cta-section">
          <div className="esg-container">
            <div className="esg-cta-content">
              <h2>Stop Paying for Backlog. Start Paying for Delivery.</h2>
              <p>Get a clear view of where your ESG data processes are leaking time and budget.</p>
              <Link href="/contact?subject=esg-audit" className="esg-btn-primary esg-btn-large mt-4">
                Book a Free 20-Minute ESG Data Audit <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />

      {/* ===== GLOBAL CSS WITH KEYFRAME ANIMATIONS ===== */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --esg-primary: #064e3b;
          --esg-primary-hover: #022c22;
          --esg-accent: #10b981;
          --esg-bg-light: #f8fafc;
          --esg-bg-dark: #0f172a;
          --esg-text-main: #0f172a;
          --esg-text-muted: #475569;
          --esg-border: #e2e8f0;
        }

        .esg-page {
          font-family: var(--font-poppins), "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--esg-text-main);
          overflow-x: hidden;
          background-color: #ffffff;
        }

        .esg-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .esg-page h1, .esg-page h2, .esg-page h3, .esg-page h4 {
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 0.75rem;
          letter-spacing: -0.03em;
        }
        
        .esg-page p { 
          line-height: 1.6; 
          color: var(--esg-text-muted); 
        }

        .bg-gray {
          background-color: var(--esg-bg-light);
          border-top: 1px solid var(--esg-border);
          border-bottom: 1px solid var(--esg-border);
        }

        .esg-section { padding: 7rem 0; }

        .esg-section-head.center {
          text-align: center;
          margin-bottom: 4rem;
        }
        .esg-section-head.center h2 {
          font-size: 2.75rem;
          max-width: 850px;
          margin: 0 auto 1.25rem;
        }
        .esg-section-head.center p {
          max-width: 700px;
          margin: 0 auto;
          font-size: 1.15rem;
        }

        /* ----- Eyebrows ----- */
        .esg-eyebrow, .esg-eyebrow-light, .esg-eyebrow-dark {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 800;
          margin: 0 0 1.25rem;
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 50px;
        }
        .esg-eyebrow { background: #ecfdf5; color: var(--esg-primary); }
        .esg-eyebrow-dark { background: #f1f5f9; color: var(--esg-text-muted); }
        .esg-eyebrow-light { background: rgba(255,255,255,0.1); color: #a7f3d0; backdrop-filter: blur(10px); }

        /* ----- Hero Section with Animations ----- */
        .esg-hero {
          position: relative;
          padding: 8rem 0 7rem;
          background-color: var(--esg-bg-dark);
          color: #ffffff;
          overflow: hidden;
        }
        .esg-hero-bg-glow {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .hero-container {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .esg-badge-animated {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          animation: pulse-border 2s infinite;
        }
        .esg-gradient-text {
          font-size: 4rem;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }
        .esg-subtitle {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--esg-accent);
          margin-bottom: 1.5rem;
          letter-spacing: -0.01em;
        }
        .esg-hero-desc {
          font-size: 1.2rem;
          color: #cbd5e1;
          margin-bottom: 3rem;
          max-width: 650px;
        }
        .esg-hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* Buttons */
        .esg-btn-primary, .esg-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 2.25rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.05rem;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .esg-btn-primary {
          background: var(--esg-accent);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }
        .esg-btn-primary:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }
        .esg-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        .esg-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Floating UI Elements */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        
        .esg-hero-visual {
          position: relative;
          height: 450px;
          width: 100%;
        }
        .esg-floating-card {
          position: absolute;
          background: #ffffff;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          animation: float 6s ease-in-out infinite;
        }
        .card-1 { top: 10%; right: 10%; width: 220px; animation-delay: 0s; }
        .card-2 { top: 40%; left: 0; width: 200px; animation-delay: 1.5s; z-index: 10; }
        .card-3 { bottom: 10%; right: 20%; width: 240px; animation-delay: 3s; }

        /* ----- Pain Points Bento Grid ----- */
        .esg-bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 250px;
          gap: 1.5rem;
        }
        .bento-image-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-image-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .bento-bg-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.8s ease;
        }
        .bento-image-card:hover .bento-bg-image {
          transform: scale(1.05);
        }
        .bento-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 100%);
        }
        .bento-content {
          position: absolute;
          bottom: 0;
          left: 0;
          padding: 2rem;
          width: 100%;
          color: #fff;
          z-index: 2;
        }
        .bento-content h3 {
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .bento-content p {
          color: #cbd5e1;
          margin: 0;
          font-size: 1rem;
        }

        /* ----- Solution Section ----- */
        .esg-solution-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
        }
        .esg-solution-copy h2 {
          font-size: 2.75rem;
          margin-bottom: 1.5rem;
        }
        .esg-solution-copy p {
          font-size: 1.15rem;
          margin-bottom: 2.5rem;
        }
        .esg-solution-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .esg-solution-list li {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--esg-text-main);
        }
        .esg-check-icon {
          color: var(--esg-accent);
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
        .esg-solution-visual {
          position: relative;
          background: var(--esg-primary);
          padding: 5rem;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(6, 78, 59, 0.25);
          overflow: hidden;
        }
        .stat-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          background: rgba(16, 185, 129, 0.3);
          filter: blur(60px);
          border-radius: 50%;
        }
        .esg-stat-box {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .esg-stat-number {
          font-size: 8rem;
          font-weight: 900;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.05em;
        }
        .esg-stat-text {
          font-size: 1.25rem;
          font-weight: 500;
          color: #d1fae5;
        }

        /* ----- Audience Grid ----- */
        .esg-audience-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }
        .bento-card {
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid var(--esg-border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }
        .bento-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -5px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }
        .support-icon-wrap {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          background: #ecfdf5;
          color: var(--esg-primary);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* ----- Trust Banner ----- */
        .esg-trust-banner {
          background: var(--esg-bg-dark);
          color: #ffffff;
          padding: 7rem 0;
        }
        .trust-container {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 4rem;
          align-items: center;
        }
        .trust-icon {
          color: #34d399;
          filter: drop-shadow(0 0 20px rgba(52, 211, 153, 0.4));
        }
        .trust-text h2 {
          font-size: 2.5rem;
          color: #ffffff;
        }
        .trust-text p {
          color: #cbd5e1;
          font-size: 1.2rem;
          max-width: 800px;
          margin: 0;
        }

        /* ----- FAQ List ----- */
        .esg-faq-list {
          max-width: 850px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .esg-faq-item {
          background: #fff;
          border: 1px solid var(--esg-border);
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .esg-faq-item:hover {
          border-color: #cbd5e1;
        }
        .esg-faq-item[open] {
          border-color: var(--esg-primary);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .esg-faq-item summary {
          padding: 1.75rem;
          font-size: 1.15rem;
          font-weight: 700;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--esg-text-main);
        }
        .esg-faq-item summary::-webkit-details-marker {
          display: none;
        }
        .esg-faq-q-text {
          padding-right: 1.5rem;
        }
        .esg-faq-toggle {
          color: var(--esg-primary);
        }
        .esg-faq-answer {
          padding: 0 1.75rem 1.75rem;
          color: var(--esg-text-muted);
          font-size: 1.05rem;
        }

        /* ----- Closing CTA ----- */
        .esg-cta-section {
          background: var(--esg-bg-light);
          padding: 8rem 0;
          text-align: center;
          border-top: 1px solid var(--esg-border);
        }
        .esg-cta-content {
          max-width: 800px;
          margin: 0 auto;
        }
        .esg-cta-section h2 {
          font-size: 3rem;
          margin-bottom: 1.25rem;
          color: var(--esg-text-main);
        }
        .esg-cta-section p {
          font-size: 1.25rem;
          color: var(--esg-text-muted);
          margin-bottom: 3rem;
        }

        /* ----- Responsive Adjustments ----- */
        @media (max-width: 1024px) {
          .hero-container, .esg-solution-grid, .esg-audience-grid {
            grid-template-columns: 1fr;
            gap: 4rem;
          }
          .trust-container { grid-template-columns: 1fr; text-align: center; justify-items: center; gap: 2rem; }
          .esg-hero h1 { font-size: 3.25rem; }
          .esg-bento-grid {
            grid-template-columns: 1fr 1fr;
            grid-auto-rows: auto;
          }
          .col-span-1, .md\\:col-span-2 { grid-column: span 1; }
          .row-span-2 { grid-row: span 1; min-height: 300px; }
          .esg-hero-visual { height: 350px; }
        }

        @media (max-width: 640px) {
          .esg-gradient-text { font-size: 2.75rem; }
          .esg-hero { padding: 6rem 0 4rem; }
          .esg-hero-actions { flex-direction: column; }
          .esg-bento-grid { grid-template-columns: 1fr; }
          .bento-image-card { min-height: 250px; }
          .bento-content { padding: 1.5rem; }
          .bento-content h3 { font-size: 1.25rem; }
          .esg-section-head.center h2, .esg-cta-section h2 { font-size: 2.25rem; }
          .esg-stat-number { font-size: 5rem; }
          .esg-solution-visual { padding: 3rem 1.5rem; }
          .esg-btn-primary, .esg-btn-secondary { width: 100%; }
        }
      `}} />
    </>
  );
}