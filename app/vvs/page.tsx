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
  Leaf,
  Recycle,
  Zap,
  Droplets,
  BadgeCheck,
  Factory,
  FileText
} from "lucide-react";

const eligibilityCriteria = [
  {
    icon: Recycle,
    title: "Recycled & Circular",
    text: "Recycled, reused, repairable, recyclable or responsibly sourced materials and products."
  },
  {
    icon: Zap,
    title: "Renewable & Clean Tech",
    text: "Renewable energy, clean technologies, energy-efficient solutions and electric mobility."
  },
  {
    icon: Droplets,
    title: "Resource Conservation",
    text: "Products supporting waste reduction, pollution prevention, and water conservation."
  },
  {
    icon: FileText,
    title: "ESG & Consulting",
    text: "Environmental, ESG, carbon management, regulatory compliance, and sustainability consulting."
  },
  {
    icon: ShieldCheck,
    title: "Certification & Testing",
    text: "Testing, inspection, auditing, certification and conformity assessment services."
  },
  {
    icon: Factory,
    title: "Sustainable Manufacturing",
    text: "Industrial technologies and solutions that improve energy, material, or resource efficiency."
  }
];

const registrationSteps = [
  { step: "01", title: "Register or Claim", text: "Create an account or claim an existing business listing with required details." },
  { step: "02", title: "Select Category", text: "Choose the most relevant industry and category for your products or services." },
  { step: "03", title: "Build Profile", text: "Add company description, location, contact details, and operating information." },
  { step: "04", title: "List Offerings", text: "Describe products accurately with specifications, material composition, and benefits." },
  { step: "05", title: "Disclose Evidence", text: "Provide supporting documentation like test reports, material declarations, or LCA data." },
  { step: "06", title: "Link Certifiers", text: "Connect applicable third-party certifications to the issuing Certification Body." },
  { step: "07", title: "Complete Review", text: "Sustainly Green conducts checks under published eligibility and verification procedures." },
  { step: "08", title: "Become Discoverable", text: "Once published, your business and verified offerings appear in relevant B2B searches." }
];

const trustLabels = [
  {
    title: "Listed Business",
    desc: "A business record is present in the directory. Its listing status alone is not proof of independent verification."
  },
  {
    title: "Business Claimed",
    desc: "The business has established control over its listing. Claiming does not establish verified sustainability claims."
  },
  {
    title: "Third-Party Certified",
    desc: "A relevant, identifiable third-party certificate has been checked. The issuing Certification Body is identified."
  },
  {
    title: "CB Profile",
    desc: "A profile for an organisation providing certification. Not a guarantee that every service is accredited."
  }
];

export default function VendorVerificationPage() {
  return (
    <>
      <Head>
        <title>Vendor Verification Standards | Sustainly Green</title>
        <meta
          name="description"
          content="Building a More Trusted Sustainable Business Ecosystem. Discover our vendor eligibility, sustainability standards, and verification processes."
        />
      </Head>

      <Header />
      <main className="vvs-page">

        {/* ===== REDESIGNED HERO (LIGHT THEME) ===== */}
        <section className="vvs-custom-hero">
          <div className="vvs-container custom-hero-container">
            
            {/* Left Content */}
            <div className="custom-hero-copy">
              <div className="custom-hero-badge">TRUST & TRANSPARENCY</div>
              <h1 className="custom-hero-h1">Building a More Trusted Sustainable Ecosystem.</h1>
              <h2 className="custom-hero-h2">Vendor Eligibility & Third-Party Verification</h2>
              <p className="custom-hero-p">
                Sustainly Green is an India-focused B2B sustainability marketplace. Our objective is to make sustainable businesses easier to discover, offerings easier to evaluate, and credible claims easier to understand.
              </p>
              
              <div className="custom-hero-actions">
                <Link href="/register" className="custom-btn-primary">
                  Register Your Business <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                <a href="#badges" className="custom-btn-secondary">
                  View Trust Badges
                </a>
              </div>
            </div>
            
            {/* Right Visuals - Staggered White Cards */}
            <div className="custom-hero-visual">
              {/* Card 1: Supplier Verified */}
              <div className="custom-floating-card c-card-1">
                <div className="c-icon-wrap text-[#10b981]">
                  <ShieldCheck size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="c-card-title">Supplier Verified</div>
                  <div className="c-card-sub">Business Credentials Check</div>
                </div>
              </div>
              
              {/* Card 2: Eco Verified */}
              <div className="custom-floating-card c-card-2">
                <div className="c-icon-wrap text-[#3b82f6]">
                  <Leaf size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="c-card-title">Eco Verified</div>
                  <div className="c-card-sub">Product Evidence Checked</div>
                </div>
              </div>
              
              {/* Card 3: Independent CBs */}
              <div className="custom-floating-card c-card-3">
                <div className="c-icon-wrap text-[#f97316]">
                  <BadgeCheck size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="c-card-title">Independent CBs</div>
                  <div className="c-card-sub">Traceable Certificates</div>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* ===== WHO CAN REGISTER (BENTO GRID) ===== */}
        <section className="vvs-section bg-gray">
          <div className="vvs-container">
            <div className="vvs-section-head center">
              <span className="vvs-eyebrow">Eligibility</span>
              <h2>Who Can Register on Sustainly Green?</h2>
              <p>
                Sustainability is a consideration across industries, products, and supply chains. Conventional industries can also participate when their listed offerings meet applicable sustainability eligibility requirements.
              </p>
            </div>
            
            <div className="vvs-services-grid">
              {eligibilityCriteria.map((item, idx) => (
                <div key={idx} className="service-card group">
                  <div className="service-icon-wrap group-hover:scale-110">
                    <item.icon size={26} className="service-icon" />
                  </div>
                  <div className="service-text-content">
                    <h3 className="service-title">{item.title}</h3>
                    <p className="service-desc">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== EARN TRUSTED BADGES (PREMIUM SHOWCASE) ===== */}
        <section id="badges" className="vvs-section">
          <div className="vvs-container">
            <div className="vvs-section-head center">
              <span className="vvs-eyebrow-dark">Verification Levels</span>
              <h2>Earn Sustainly Green's Trusted Badges</h2>
              <p>
                We encourage all vendors to follow applicable compliance requirements. Our two trust badges recognise different levels of verification: one for business credentials and another for product-level evidence.
              </p>
            </div>

            <div className="vvs-badges-grid">
              {/* Supplier Verified Badge */}
              <div className="badge-showcase-card">
                <div className="badge-glow supplier-glow"></div>
                <div className="badge-icon-container">
                  <Building2 size={48} className="text-blue-600" />
                </div>
                <h3>Supplier Verified</h3>
                <span className="badge-subtitle">Business Verification</span>
                <p>
                  For businesses that meet verification requirements by providing supporting business documents, such as GST registration, CIN, and proof of business address. Helps buyers identify suppliers whose business credentials have been reviewed.
                </p>
              </div>

              {/* Eco Verified Badge with your vvs.jpeg */}
              <div className="badge-showcase-card">
                <div className="badge-glow eco-glow"></div>
                
                <div className="badge-icon-container overflow-hidden border-2 border-emerald-100 p-1">
                  <img 
                    src="/vvs.jpeg" 
                    alt="Sustainly Green Eco Verified Badge" 
                    className="h-full w-full rounded-full object-contain" 
                  />
                </div>
                
                <h3>Eco Verified</h3>
                <span className="badge-subtitle">Product Evidence Verification</span>
                <p>
                  For individual products whose sustainability claims are supported by relevant documentation. Evidence may include certificates issued by recognised Certification Bodies, test reports, material declarations, or recycled-content documentation.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center text-sm text-slate-500 max-w-3xl mx-auto">
              <strong>Important:</strong> Supplier Verified and Eco Verified are separate badges. A verified business does not automatically receive Eco Verified status, and product documents do not automatically verify business credentials.
            </div>
          </div>
        </section>

        {/* ===== REGISTRATION JOURNEY (TIMELINE GRID) ===== */}
        <section className="vvs-section bg-gray">
          <div className="vvs-container">
            <div className="vvs-section-head center">
              <span className="vvs-eyebrow">The Process</span>
              <h2>How Vendor Registration Works</h2>
              <p>Our journey is designed to help businesses establish a digital presence and make their offerings discoverable to relevant B2B buyers transparently.</p>
            </div>
            
            <div className="vvs-steps-grid">
              {registrationSteps.map((step, idx) => (
                <div key={idx} className="step-card group">
                  <div className="step-number group-hover:bg-emerald-600 group-hover:text-white transition-colors">{step.step}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-text">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TRUST LABELS ===== */}
        <section className="vvs-section">
          <div className="vvs-container">
            <div className="vvs-section-head center">
              <span className="vvs-eyebrow-dark">Transparency</span>
              <h2>Understanding Trust Labels</h2>
              <p>Different trust labels represent different checks. They never imply a level of assurance greater than the evidence supports.</p>
            </div>
            
            <div className="vvs-labels-grid">
              {trustLabels.map((label, idx) => (
                <div key={idx} className="label-bento-card group">
                  <div className="label-icon-wrap group-hover:-translate-y-2 transition-transform duration-300">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{label.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{label.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CLOSING CTA ===== */}
        <section className="vvs-cta-section">
          <div className="vvs-container">
            <div className="vvs-cta-content">
              <h2>Register, Discover and Build Trusted Connections.</h2>
              <p>A marketplace where sustainable solutions can be discovered, evidence can be understood and business connections can be built with greater transparency.</p>
              <Link href="/register" className="vvs-btn-primary vvs-btn-large mt-4">
                Register Your Business <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />

      {/* ===== GLOBAL CSS ===== */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --vvs-primary: #064e3b;
          --vvs-accent: #10b981;
          --vvs-bg-light: #f8fafc;
          --vvs-text-main: #0f172a;
          --vvs-text-muted: #475569;
          --vvs-border: #e2e8f0;
        }

        .vvs-page {
          font-family: var(--font-poppins), "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--vvs-text-main);
          overflow-x: hidden;
          background-color: #ffffff;
        }

        .vvs-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .vvs-page h1, .vvs-page h2, .vvs-page h3, .vvs-page h4 {
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 0.75rem;
          letter-spacing: -0.03em;
        }
        
        .vvs-page p { 
          line-height: 1.6; 
          color: var(--vvs-text-muted); 
        }

        /* ===== REDESIGNED CUSTOM HERO (LIGHT THEME) ===== */
        .vvs-custom-hero {
          background: linear-gradient(to bottom right, #ffffff, #f1f5f9);
          padding: 8rem 0 9rem;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--vvs-border);
        }
        
        .custom-hero-container {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 4rem;
          align-items: center;
        }

        .custom-hero-copy {
          position: relative;
          z-index: 10;
        }

        .custom-hero-badge {
          display: inline-block;
          border: 1px solid rgba(16, 185, 129, 0.4);
          background-color: rgba(16, 185, 129, 0.1);
          color: #059669; /* Darker emerald for light bg */
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.4rem 1.25rem;
          border-radius: 50px;
          margin-bottom: 1.75rem;
        }

        .custom-hero-h1 {
          font-size: 4rem;
          color: #0f172a; /* Dark text */
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }

        .custom-hero-h2 {
          font-size: 1.75rem;
          color: #475569; /* Slate 600 */
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .custom-hero-p {
          font-size: 1.15rem;
          color: #64748b; /* Slate 500 */
          max-width: 600px;
          margin-bottom: 3rem;
          line-height: 1.7;
        }

        .custom-hero-actions {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .custom-btn-primary {
          background-color: #10b981;
          color: #ffffff;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.05rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }
        
        .custom-btn-primary:hover {
          background-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
        }

        .custom-btn-secondary {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.05rem;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .custom-btn-secondary:hover {
          background-color: #f1f5f9;
          border-color: #94a3b8;
        }

        /* Hero Right Visuals - Solid White Cards */
        .custom-hero-visual {
          position: relative;
          height: 450px;
          width: 100%;
        }

        @keyframes float-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .custom-floating-card {
          position: absolute;
          background-color: #ffffff;
          border-radius: 16px;
          padding: 1.5rem 1.5rem 1.5rem 1.25rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); /* Adjusted for light theme */
          border: 1px solid var(--vvs-border);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          width: 280px;
          animation: float-gentle 6s ease-in-out infinite;
        }

        .c-icon-wrap {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }

        .c-card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .c-card-sub {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        .c-card-1 {
          top: 15%;
          right: 5%;
          animation-delay: 0s;
          z-index: 3;
        }

        .c-card-2 {
          top: 45%;
          left: 0;
          animation-delay: 1.5s;
          z-index: 2;
        }

        .c-card-3 {
          bottom: 5%;
          right: 15%;
          animation-delay: 3s;
          z-index: 4;
        }

        /* ----- Base Sections ----- */
        .bg-gray {
          background-color: var(--vvs-bg-light);
          border-top: 1px solid var(--vvs-border);
          border-bottom: 1px solid var(--vvs-border);
        }

        .vvs-section { padding: 7rem 0; }

        .vvs-section-head.center {
          text-align: center;
          margin-bottom: 4rem;
        }
        .vvs-section-head.center h2 {
          font-size: 2.75rem;
          max-width: 850px;
          margin: 0 auto 1.25rem;
        }
        .vvs-section-head.center p {
          max-width: 700px;
          margin: 0 auto;
          font-size: 1.15rem;
        }

        .vvs-eyebrow, .vvs-eyebrow-dark {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 800;
          margin: 0 0 1.25rem;
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 50px;
        }
        .vvs-eyebrow { background: #ecfdf5; color: var(--vvs-primary); }
        .vvs-eyebrow-dark { background: #f1f5f9; color: var(--vvs-text-muted); }

        /* ----- Services Grid ----- */
        .vvs-services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .service-card {
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid var(--vvs-border);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          gap: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .service-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: var(--vvs-accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }
        .service-card:hover {
          transform: translateY(-8px);
          border-color: transparent;
          box-shadow: 0 20px 40px -5px rgba(0,0,0,0.08);
        }
        .service-card:hover::before {
          transform: scaleX(1);
        }
        .service-icon-wrap {
          width: 60px;
          height: 60px;
          background: #ecfdf5;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--vvs-primary);
          transition: all 0.3s ease;
        }
        .service-card:hover .service-icon-wrap {
          background: var(--vvs-primary);
          color: #fff;
        }
        .service-text-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .service-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--vvs-text-main);
          margin: 0;
          line-height: 1.3;
        }
        .service-desc {
          font-size: 1rem;
          color: var(--vvs-text-muted);
          line-height: 1.6;
          margin: 0;
        }

        /* ----- Badges Grid ----- */
        .vvs-badges-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 3rem;
          margin-bottom: 2rem;
        }
        .badge-showcase-card {
          position: relative;
          background: #ffffff;
          padding: 4rem 3rem;
          border-radius: 32px;
          border: 1px solid var(--vvs-border);
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .badge-showcase-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
        .badge-glow {
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          width: 250px;
          height: 250px;
          filter: blur(80px);
          border-radius: 50%;
          z-index: 0;
          opacity: 0.3;
        }
        .supplier-glow { background: #3b82f6; }
        .eco-glow { background: #10b981; }
        
        .badge-icon-container {
          position: relative;
          z-index: 1;
          width: 100px;
          height: 100px;
          margin: 0 auto 1.5rem;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .badge-showcase-card h3 {
          position: relative;
          z-index: 1;
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .badge-subtitle {
          position: relative;
          z-index: 1;
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: var(--vvs-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.5rem;
        }
        .badge-showcase-card p {
          position: relative;
          z-index: 1;
          font-size: 1.1rem;
          color: var(--vvs-text-muted);
        }

        /* ----- Steps Grid ----- */
        .vvs-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .step-card {
          background: #ffffff;
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid var(--vvs-border);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.3s ease;
        }
        .step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.06);
          border-color: var(--vvs-accent);
        }
        .step-number {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          color: var(--vvs-primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 900;
          margin-bottom: 1.25rem;
        }
        .step-title {
          font-size: 1.15rem;
          margin-bottom: 0.5rem;
        }
        .step-text {
          font-size: 0.95rem;
          color: var(--vvs-text-muted);
        }

        /* ----- Labels Grid ----- */
        .vvs-labels-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }
        .label-bento-card {
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid var(--vvs-border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }
        .label-bento-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -5px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }
        .label-icon-wrap {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          background: #ecfdf5;
          color: var(--vvs-primary);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ----- Closing CTA ----- */
        .vvs-cta-section {
          background: var(--vvs-bg-light);
          padding: 8rem 0;
          text-align: center;
          border-top: 1px solid var(--vvs-border);
        }
        .vvs-cta-content {
          max-width: 800px;
          margin: 0 auto;
        }
        .vvs-cta-section h2 {
          font-size: 3rem;
          margin-bottom: 1.25rem;
          color: var(--vvs-text-main);
        }
        .vvs-cta-section p {
          font-size: 1.25rem;
          color: var(--vvs-text-muted);
          margin-bottom: 3rem;
        }

        /* ----- Responsive Adjustments ----- */
        @media (max-width: 1024px) {
          .custom-hero-container { grid-template-columns: 1fr; gap: 4rem; }
          .custom-hero-h1 { font-size: 3.25rem; }
          .custom-hero-visual { height: 350px; }
          .c-card-1 { top: 0; right: 10%; }
          .c-card-2 { top: 35%; left: 10%; }
          .c-card-3 { bottom: 0; right: 20%; }
          
          .vvs-badges-grid { grid-template-columns: 1fr; gap: 2rem; }
          .vvs-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .vvs-labels-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .custom-hero-h1 { font-size: 2.5rem; }
          .custom-hero-h2 { font-size: 1.5rem; }
          .vvs-custom-hero { padding: 6rem 0 4rem; }
          .custom-hero-actions { flex-direction: column; }
          .vvs-section-head.center h2, .vvs-cta-section h2 { font-size: 2.25rem; }
          .custom-btn-primary, .custom-btn-secondary { width: 100%; justify-content: center; }
          .vvs-steps-grid { grid-template-columns: 1fr; }
          .badge-showcase-card { padding: 2rem 1.5rem; }
        }
      `}} />
    </>
  );
}