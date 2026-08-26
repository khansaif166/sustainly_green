"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import { Check, Minus, X } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "dark";

interface PricingCardProps {
  title: string;
  price: string;
  subtitle: string;
  bestFor: string;
  ctaText: string;
  buttonVariant: ButtonVariant;
  isPopular?: boolean;
}

interface FeatureRowProps {
  label: string;
  val1: React.ReactNode;
  val2: React.ReactNode;
  val3: React.ReactNode;
  val4: React.ReactNode;
}

export default function PricingClient() {
  const [billingCycle, setBillingCycle] = useState<"quarterly" | "biannually" | "annually">("annually");
  const [audience, setAudience] = useState<"suppliers" | "buyers">("suppliers");
  const [showPopup, setShowPopup] = useState(false);

  // Trigger popup 1.5 seconds after the page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const pricingData = {
    community: { quarterly: "Free", biannually: "Free", annually: "Free" },
    verified: { quarterly: "₹2,400", biannually: "₹4,400", annually: "₹8,000" },
    growth: { quarterly: "₹4,200", biannually: "₹8,000", annually: "₹15,000" },
    impact: { quarterly: "₹10,000", biannually: "₹18,000", annually: "₹35,000" },
  };

  const getSubtitle = () => {
    if (billingCycle === "quarterly") return "per quarter";
    if (billingCycle === "biannually") return "per bi-annual";
    return "per year";
  };

  return (
    <>
      <Header />

      <main className="w-full max-w-6xl mx-auto px-6 md:px-12 py-16 flex flex-col justify-center relative">

        {/* ================= VALUE PROPOSITION / BENTO BOX WITH ANIMATED SVGS ================= */}
        <section className="mb-24 flex flex-col items-center w-full">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8 text-center tracking-tight">
            The green marketplace built for you.
          </h1>

          <div className="inline-flex bg-gray-800 p-1.5 rounded-full mb-10 shadow-md">
            <button
              onClick={() => setAudience("suppliers")}
              className={`px-6 sm:px-8 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                audience === "suppliers"
                  ? "bg-[#0c6b58] text-white shadow-sm"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              For Suppliers
            </button>
            <button
              onClick={() => setAudience("buyers")}
              className={`px-6 sm:px-8 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                audience === "buyers"
                  ? "bg-[#0c6b58] text-white shadow-sm"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              For Buyers
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
            {audience === "suppliers" ? (
              <>
                {/* Card 1: Light Beige */}
                <div className="bg-[#f4f1ea] rounded-3xl p-6 md:p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-red-500 font-bold text-xs tracking-wider uppercase mb-3 block">SEO & Visibility</span>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">Be the first store in search</h3>
                      <p className="text-gray-700 text-sm">Our custom-built architecture and SEO tools ensure your digital profile is found first.</p>
                    </div>
                    {/* Animated SVG: Search Browser */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
                        <rect x="10" y="30" width="100" height="70" rx="6" fill="white" stroke="#d1d5db" strokeWidth="2"/>
                        <path d="M10 36 C10 32.6 12.6 30 16 30 L104 30 C107.3 30 110 32.6 110 36 L110 45 L10 45 Z" fill="#f3f4f6"/>
                        <circle cx="20" cy="37.5" r="3" fill="#ef4444"/><circle cx="30" cy="37.5" r="3" fill="#eab308"/><circle cx="40" cy="37.5" r="3" fill="#22c55e"/>
                        <rect x="20" y="60" width="80" height="16" rx="8" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="2"/>
                        <rect x="25" y="66" width="30" height="4" rx="2" fill="#d1d5db"/>
                        {/* Animated Magnifying Glass */}
                        <g className="transform transition-transform duration-700 ease-in-out group-hover:translate-x-12">
                          <circle cx="35" cy="68" r="6" stroke="#0c6b58" strokeWidth="2.5" fill="none"/>
                          <line x1="39" y1="72" x2="45" y2="78" stroke="#0c6b58" strokeWidth="2.5" strokeLinecap="round"/>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 2: White bordered */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-red-500 font-bold text-xs tracking-wider uppercase mb-3 block">B2B Network</span>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">Make them buy where they browse</h3>
                      <p className="text-gray-600 text-sm">Connect directly with a curated network of buyers and stand out with verified badges.</p>
                    </div>
                    {/* Animated SVG: Mobile Store */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
                        <rect x="35" y="15" width="50" height="90" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
                        <rect x="40" y="25" width="40" height="65" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
                        <rect x="45" y="30" width="30" height="4" rx="2" fill="#e2e8f0"/>
                        {/* Animated Product Pop */}
                        <g className="transform transition-transform duration-500 group-hover:-translate-y-3 group-hover:scale-110 origin-bottom">
                          <rect x="45" y="45" width="30" height="30" rx="6" fill="#d1fae5" stroke="#10b981" strokeWidth="2"/>
                          <circle cx="60" cy="60" r="6" fill="#0c6b58"/>
                        </g>
                        <circle cx="60" cy="98" r="4" fill="#cbd5e1"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 3: Solid Green */}
                <div className="bg-[#0c6b58] rounded-3xl p-6 md:p-8 flex flex-col justify-between text-white group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-[#a7f3d0] font-bold text-xs tracking-wider uppercase mb-3 block">RFQs & Campaigns</span>
                      <h3 className="text-xl md:text-2xl font-bold leading-tight mb-3">Get shoppers to the finish line</h3>
                      <p className="text-emerald-50 text-sm">Receive qualified RFQs directly and utilize priority recommendations to secure contracts.</p>
                    </div>
                    {/* Animated SVG: RFQ Document Slide */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
                        <rect x="25" y="50" width="70" height="45" rx="4" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2"/>
                        {/* Animated Paper pulling out */}
                        <g className="transform transition-transform duration-500 ease-out group-hover:-translate-y-12">
                          <rect x="35" y="30" width="50" height="40" rx="2" fill="#d1fae5"/>
                          <line x1="45" y1="40" x2="75" y2="40" stroke="#0c6b58" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="45" y1="50" x2="65" y2="50" stroke="#0c6b58" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                        <path d="M25 50 L60 70 L95 50" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 4: Dark */}
                <div className="bg-gray-900 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-white group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-blue-400 font-bold text-xs tracking-wider uppercase mb-3 block">Scale & Growth</span>
                      <h3 className="text-xl md:text-2xl font-bold leading-tight mb-3">Sell B2B at scale</h3>
                      <p className="text-gray-300 text-sm">Leverage unlimited product listings and deep analytics. We provide the tools for growth.</p>
                    </div>
                    {/* Animated SVG: Growing Bar Chart */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full">
                        <line x1="20" y1="100" x2="100" y2="100" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="20" y1="100" x2="20" y2="20" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
                        {/* Bars that grow on hover */}
                        <rect x="30" y="70" width="16" height="30" rx="2" fill="#3b82f6" className="transform origin-bottom transition-transform duration-500 group-hover:scale-y-[1.2]"/>
                        <rect x="55" y="50" width="16" height="50" rx="2" fill="#60a5fa" className="transform origin-bottom transition-transform duration-500 delay-75 group-hover:scale-y-[1.4]"/>
                        <rect x="80" y="30" width="16" height="70" rx="2" fill="#93c5fd" className="transform origin-bottom transition-transform duration-500 delay-150 group-hover:scale-y-[1.1]"/>
                        {/* Animated Trend Line */}
                        <path d="M38 60 L63 35 L88 15" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transform transition-all duration-700 opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 drop-shadow-md"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* BUYER CARDS */}
                {/* Card 1: Light Beige */}
                <div className="bg-[#f4f1ea] rounded-3xl p-6 md:p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-red-500 font-bold text-xs tracking-wider uppercase mb-3 block">Verified Sourcing</span>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">Source with absolute confidence</h3>
                      <p className="text-gray-700 text-sm">Every supplier undergoes strict checks for eco-certifications. Say goodbye to greenwashing.</p>
                    </div>
                    {/* Animated SVG: Verified Shield */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
                        {/* Shield pulsing */}
                        <g className="transform transition-transform duration-500 origin-center group-hover:scale-110">
                          <path d="M60 20 L90 35 L90 65 C90 85 60 105 60 105 C60 105 30 85 30 65 L30 35 Z" fill="#ffffff" stroke="#0c6b58" strokeWidth="3" strokeLinejoin="round"/>
                          <path d="M45 60 L55 70 L75 45" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" className="transform transition-all duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-110 origin-center"/>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 2: White bordered */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-red-500 font-bold text-xs tracking-wider uppercase mb-3 block">Smart Discovery</span>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">Find exactly what you need</h3>
                      <p className="text-gray-600 text-sm">Filter through a rich directory of sustainable products tailored for your specific industry.</p>
                    </div>
                    {/* Animated SVG: Filter Funnel */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
                        <path d="M20 30 L100 30 L70 70 L70 100 L50 90 L50 70 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round"/>
                        {/* Drops falling into filter */}
                        <circle cx="60" cy="15" r="5" fill="#10b981" className="transform transition-transform duration-500 ease-in group-hover:translate-y-12 opacity-0 group-hover:opacity-100"/>
                        <circle cx="45" cy="5" r="4" fill="#3b82f6" className="transform transition-transform duration-700 ease-in delay-75 group-hover:translate-y-16 opacity-0 group-hover:opacity-100"/>
                        <circle cx="75" cy="10" r="4" fill="#eab308" className="transform transition-transform duration-500 ease-in delay-150 group-hover:translate-y-14 opacity-0 group-hover:opacity-100"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 3: Solid Green */}
                <div className="bg-[#0c6b58] rounded-3xl p-6 md:p-8 flex flex-col justify-between text-white group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-[#a7f3d0] font-bold text-xs tracking-wider uppercase mb-3 block">Seamless RFQs</span>
                      <h3 className="text-xl md:text-2xl font-bold leading-tight mb-3">Streamline your procurement</h3>
                      <p className="text-emerald-50 text-sm">Request quotes, compare vendors, and finalize deals in one centralized B2B hub.</p>
                    </div>
                    {/* Animated SVG: Clipboard Checklist */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
                        <rect x="30" y="25" width="60" height="75" rx="4" fill="white"/>
                        <rect x="45" y="15" width="30" height="15" rx="4" fill="#9ca3af"/>
                        <line x1="45" y1="45" x2="80" y2="45" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="45" y1="65" x2="80" y2="65" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="45" y1="85" x2="65" y2="85" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round"/>
                        {/* Animated Checkmarks */}
                        <g className="stroke-[#10b981] stroke-[3px] fill-none stroke-linecap-round stroke-linejoin-round opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <path d="M35 45 L38 48 L42 43" className="transition-all duration-300 delay-100"/>
                          <path d="M35 65 L38 68 L42 63" className="transition-all duration-300 delay-200"/>
                          <path d="M35 85 L38 88 L42 83" className="transition-all duration-300 delay-300"/>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 4: Dark */}
                <div className="bg-gray-900 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-white group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center gap-4 h-full">
                    <div className="w-3/5 z-10">
                      <span className="text-blue-400 font-bold text-xs tracking-wider uppercase mb-3 block">ESG Compliance</span>
                      <h3 className="text-xl md:text-2xl font-bold leading-tight mb-3">Meet your sustainability goals</h3>
                      <p className="text-gray-300 text-sm">Partner with verified green suppliers to confidently hit your corporate targets.</p>
                    </div>
                    {/* Animated SVG: Target and Arrow */}
                    <div className="w-2/5 flex justify-end relative h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
                        <circle cx="60" cy="60" r="40" fill="#1e293b" stroke="#334155" strokeWidth="4"/>
                        <circle cx="60" cy="60" r="25" fill="#334155" stroke="#475569" strokeWidth="4"/>
                        <circle cx="60" cy="60" r="10" fill="#ef4444"/>
                        {/* Animated Arrow sliding into center */}
                        <g className="transform transition-transform duration-500 ease-out translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:translate-y-0">
                          <line x1="60" y1="60" x2="95" y2="25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
                          <polygon points="60,60 70,55 65,70" fill="#ffffff"/>
                          <circle cx="95" cy="25" r="3" fill="#3b82f6"/>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ================= PRICING HEADER & TOGGLE ================= */}
        <section className="text-center space-y-4 flex flex-col items-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Choose your growth plan
          </h2>
          <div className="inline-flex items-center bg-white p-1 rounded-full border border-gray-200 shadow-sm flex-wrap justify-center">
            <button
              onClick={() => setBillingCycle("quarterly")}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                billingCycle === "quarterly"
                  ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setBillingCycle("biannually")}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                billingCycle === "biannually"
                  ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Bi-Annually
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                billingCycle === "annually"
                  ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Annually (Save 20%)
            </button>
          </div>
        </section>

        {/* ================= PRICING CARDS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-12">
          <PricingCard
            title="Community"
            price={pricingData.community[billingCycle]}
            subtitle="Forever Free"
            bestFor="New brands & discovery"
            ctaText="Register Profile"
            buttonVariant="secondary"
          />
          <PricingCard
            title="Verified"
            price={pricingData.verified[billingCycle]}
            subtitle={getSubtitle()}
            bestFor="SMEs needing credibility"
            ctaText="Get Verified"
            buttonVariant="primary"
          />
          <PricingCard
            title="Growth"
            price={pricingData.growth[billingCycle]}
            subtitle={getSubtitle()}
            bestFor="Active B2B suppliers"
            ctaText="Grow Your Reach"
            buttonVariant="primary"
            isPopular
          />
          <PricingCard
            title="Impact Partner"
            price={pricingData.impact[billingCycle]}
            subtitle={getSubtitle()}
            bestFor="Established organizations"
            ctaText="Become a Partner"
            buttonVariant="dark"
          />
        </section>

        {/* ================= FEATURE COMPARISON TABLE ================= */}
        <section className="w-full">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
            Compare all features
          </h2>
          <div className="w-full overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-1/5 py-3 px-3 font-bold text-gray-900 text-sm">Features</th>
                  <th className="w-1/5 py-3 px-3 font-bold text-center text-gray-900 text-sm">Community</th>
                  <th className="w-1/5 py-3 px-3 font-bold text-center text-gray-900 text-sm">Verified</th>
                  <th className="w-1/5 py-3 px-3 font-bold text-center text-gray-900 text-sm">Growth</th>
                  <th className="w-1/5 py-3 px-3 font-bold text-center text-gray-900 text-sm">Impact Partner</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr>
                  <td colSpan={5} className="py-2 px-3 font-bold text-white bg-[#0c6b58]">
                    Visibility & Trust
                  </td>
                </tr>
                <FeatureRow label="Search Ranking" val1="Standard" val2="Featured" val3="Featured" val4="Premium placement" />
                <FeatureRow label="Trust Badge" val1={<Minus className="mx-auto text-gray-300" size={16} />} val2="Supplier Verified" val3="Supplier & Eco Verified" val4="Supplier & Eco Verified" />
                <FeatureRow label="Directory Listing" val1="Basic" val2="Rich" val3="Rich" val4="Rich" />
                <FeatureRow label="Profile Type" val1="Self-managed" val2="Claimed + Verified" val3="Claimed + Enhanced" val4="Premium Partner Profile" />
                <FeatureRow label="Homepage Spotlight" val1="No" val2="No" val3="Limited rotation" val4="Included rotation" />
                <FeatureRow label="Buyer Recommendations" val1="No" val2="Standard" val3="Priority" val4="Priority" />

                <tr>
                  <td colSpan={5} className="py-2 px-3 font-bold text-white bg-[#0c6b58] mt-4">
                    Profile & Content
                  </td>
                </tr>
                <FeatureRow label="Digital Profile" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
                <FeatureRow label="Company Bio" val1="Standard, source-based" val2="Vendor-written, up to 500 words" val3="Rich branded overview" val4="Full story + sustainability narrative" />
                <FeatureRow label="Photo & Video Gallery" val1="Logo + 3 images" val2="Logo + 8 images" val3="Logo + 15 images + 1 video" val4="Gallery + video + downloadable assets" />
                <FeatureRow label="Business Info" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
                <FeatureRow label="Trade Details" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
                <FeatureRow label="Sustainability Claims" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
                <FeatureRow label="Certifications Shown" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />

                <tr>
                  <td colSpan={5} className="py-2 px-3 font-bold text-white bg-[#0c6b58] mt-4">
                    Leads & Growth
                  </td>
                </tr>
                <FeatureRow label="Product Listings" val1="Unlimited" val2="Unlimited" val3="Unlimited" val4="Unlimited" />
                <FeatureRow label="RFQ & Enquiries" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
                <FeatureRow label="Performance Analytics" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />

                <tr>
                  <td colSpan={5} className="py-2 px-3 font-bold text-white bg-[#0c6b58] mt-4">
                    Support & Team
                  </td>
                </tr>
                <FeatureRow label="Customer Support" val1="Email" val2="Priority email" val3="Priority Email & Call" val4="Account manager / quarterly review" />
                <FeatureRow label="Renewal Alerts" val1={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val2={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
                <FeatureRow label="Team Seats" val1="1 admin" val2="2 users" val3="3 users" val4="10 users" />

                <tr>
                  <td colSpan={5} className="py-2 px-3 font-bold text-white bg-[#0c6b58] mt-4">
                    Premium ESG Add-ons
                  </td>
                </tr>
                <FeatureRow label="ESG Advisory" val1={<Minus className="mx-auto text-gray-300" size={16} />} val2={<Minus className="mx-auto text-gray-300" size={16} />} val3={<Minus className="mx-auto text-gray-300" size={16} />} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
                <FeatureRow label="Certification Help" val1={<Minus className="mx-auto text-gray-300" size={16} />} val2={<Minus className="mx-auto text-gray-300" size={16} />} val3={<Check className="mx-auto text-[#0c6b58]" size={16}/>} val4={<Check className="mx-auto text-[#0c6b58]" size={16}/>} />
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />

     {/* ================= 3D POPUP MODAL ================= */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-300">

          <div className="relative w-full max-w-2xl bg-[#f4f1ea] rounded-3xl shadow-2xl p-6 md:p-8 overflow-visible">

            {/* Close Button */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 z-20 text-gray-500 hover:text-gray-900 transition bg-white/50 rounded-full p-1.5"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content Area */}
            <div className="relative z-10 w-full md:w-1/2 pr-0 md:pr-4">

              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-white border border-[#0c6b58] rounded-md flex items-center justify-center text-[#0c6b58] font-bold text-xs">
                  SG
                </div>
                <span className="font-bold text-gray-900 text-base tracking-tight">Sustainly Green</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-1">
                New to Sustainly Green?
              </h2>
              <h3 className="text-2xl md:text-3xl font-extrabold text-[#0c6b58] mb-6">
                Talk to our experts
              </h3>

              <button className="bg-[#4ade80] hover:bg-[#22c55e] text-gray-900 font-bold py-3 px-6 rounded-full transition shadow-sm text-sm">
                Schedule a free demo
              </button>
            </div>

            {/* 3D Overlapping Image - Anchored to the right side */}
            <Image
              src="/pricing-expert-cutout.png"
              alt="Talk to an expert"
              width={956}
              height={1422}
              className="hidden md:block absolute bottom-0 right-2 h-[115%] w-auto max-w-[45%] object-contain object-bottom z-0 pointer-events-none drop-shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ================= SUB-COMPONENTS ================= */

function PricingCard({ title, price, subtitle, bestFor, ctaText, buttonVariant, isPopular = false }: PricingCardProps) {
  const btnStyles: Record<ButtonVariant, string> = {
    primary: "bg-[#0c6b58] text-white hover:brightness-95",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
    dark: "bg-[#0f172a] text-white hover:bg-gray-800",
  };

  return (
    <div className={`relative bg-white rounded-xl border ${isPopular ? 'border-[#0c6b58] shadow-md' : 'border-gray-200'} p-5 flex flex-col`}>
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0c6b58] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
          MOST POPULAR
        </span>
      )}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-1 h-8">Best for: {bestFor}</p>
      </div>
      <div className="mb-6 flex-grow">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-gray-900">{price}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
      <button className={`w-full rounded-full py-2.5 text-sm font-semibold transition ${btnStyles[buttonVariant]}`}>
        {ctaText}
      </button>
    </div>
  );
}

function FeatureRow({ label, val1, val2, val3, val4 }: FeatureRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50/50 transition">
      <td className="py-3 px-3 text-gray-700 font-medium text-sm truncate" title={label}>{label}</td>
      <td className="py-3 px-3 text-center text-gray-700 text-sm">{val1}</td>
      <td className="py-3 px-3 text-center text-gray-700 text-sm">{val2}</td>
      <td className="py-3 px-3 text-center text-gray-700 text-sm">{val3}</td>
      <td className="py-3 px-3 text-center text-gray-700 text-sm">{val4}</td>
    </tr>
  );
}
