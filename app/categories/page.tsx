"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { fetchActiveCategories } from "@/lib/supabasePublic";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import { FiArrowLeft, FiGrid, FiSearch } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import {
  ArrowUpRight,
  BatteryCharging,
  Bike,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CircleGauge,
  Droplets,
  Factory,
  FlaskConical,
  HeartHandshake,
  Leaf,
  PackageOpen,
  Plane,
  Recycle,
  ShieldCheck,
  Shirt,
  Sprout,
  SunMedium,
  TreePine,
  Wheat,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  vendorCount?: number;
};

const STATIC_CATEGORIES = [
  { id: "s1", name: "Renewable Energy", icon: "☀️", count: "84 vendors", desc: "Solar EPC, wind energy, biogas, and clean power solutions." },
  { id: "s2", name: "Sustainable Packaging", icon: "📦", count: "67 vendors", desc: "Recycled, biodegradable, and compostable packaging for B2B." },
  { id: "s3", name: "Green Mobility", icon: "🚗", count: "42 vendors", desc: "EV charging infrastructure, fleet electrification, clean transport." },
  { id: "s4", name: "Water Management", icon: "💧", count: "38 vendors", desc: "ETP, STP, water recycling, and rainwater harvesting systems." },
  { id: "s5", name: "Waste Management", icon: "♻️", count: "55 vendors", desc: "Industrial waste collection, EPR compliance, e-waste management." },
  { id: "s6", name: "Sustainable Textiles", icon: "👕", count: "49 vendors", desc: "Organic, recycled, and ethical fabric sourcing for enterprises." },
  { id: "s7", name: "Green Construction", icon: "🏗️", count: "31 vendors", desc: "Eco-friendly building materials, green certified construction." },
  { id: "s8", name: "Agri & Food", icon: "🌾", count: "44 vendors", desc: "Organic farming inputs, sustainable food supply chains." },
  { id: "s9", name: "Energy Storage", icon: "🔋", count: "27 vendors", desc: "Industrial battery solutions, grid-scale ESS, backup power." },
  { id: "s10", name: "Carbon Credits", icon: "🌡️", count: "19 vendors", desc: "Verified carbon offset projects and credit trading platforms." },
  { id: "s11", name: "Clean Manufacturing", icon: "🏭", count: "36 vendors", desc: "Lean and clean production processes, sustainable operations." },
  { id: "s12", name: "Energy Efficiency", icon: "💡", count: "41 vendors", desc: "LED retrofits, HVAC optimization, energy auditing services." },
  { id: "s13", name: "Green Chemicals", icon: "🧪", count: "22 vendors", desc: "Bio-based, non-toxic, and REACH-compliant chemical alternatives." },
  { id: "s14", name: "ESG Consulting", icon: "📊", count: "33 vendors", desc: "BRSR, GRI, TCFD reporting, ESG strategy, and assurance." },
];

const CATEGORY_THEMES = [
  { surface: "#eef8ee", accent: "#238636", glow: "#bfe7c6" },
  { surface: "#eef8f7", accent: "#087f73", glow: "#b9e7df" },
  { surface: "#f1f5fb", accent: "#2563a8", glow: "#c9daf3" },
  { surface: "#fff6e9", accent: "#b45f06", glow: "#f8d49d" },
  { surface: "#f7f1fb", accent: "#7c3f98", glow: "#dfc9ec" },
  { surface: "#f3f7ed", accent: "#527a22", glow: "#d2e4b7" },
] as const;

function categoryIcon(name: string): LucideIcon {
  const value = name.toLowerCase();

  if (value.includes("solar") || value.includes("renewable")) return SunMedium;
  if (value.includes("water")) return Droplets;
  if (value.includes("waste") || value.includes("recycl")) return Recycle;
  if (value.includes("packag")) return PackageOpen;
  if (value.includes("textile") || value.includes("fashion")) return Shirt;
  if (value.includes("mobility") || value.includes("vehicle") || value.includes("ev")) return Bike;
  if (value.includes("energy storage") || value.includes("battery")) return BatteryCharging;
  if (value.includes("energy efficiency")) return Zap;
  if (value.includes("building") || value.includes("construction")) return Building2;
  if (value.includes("agri") || value.includes("food")) return Wheat;
  if (value.includes("chemical")) return FlaskConical;
  if (value.includes("manufactur") || value.includes("industrial")) return Factory;
  if (value.includes("esg") || value.includes("certif")) return ShieldCheck;
  if (value.includes("carbon") || value.includes("climate")) return Wind;
  if (value.includes("consult") || value.includes("audit")) return ChartNoAxesCombined;
  if (value.includes("tourism") || value.includes("travel")) return Plane;
  if (value.includes("family") || value.includes("care") || value.includes("health")) return HeartHandshake;
  if (value.includes("forest") || value.includes("biodiversity")) return TreePine;
  if (value.includes("organic")) return Sprout;
  if (value.includes("product")) return Boxes;
  if (value.includes("technology") || value.includes("monitor")) return CircleGauge;
  return Leaf;
}

function categoryDescription(name: string) {
  const value = name.toLowerCase();

  if (value.includes("water")) return "Treatment, conservation and water-reuse solutions.";
  if (value.includes("waste") || value.includes("recycl")) return "Circular recovery, recycling and responsible disposal.";
  if (value.includes("textile") || value.includes("fashion")) return "Responsible fabrics, apparel and ethical sourcing.";
  if (value.includes("mobility") || value.includes("vehicle") || value.includes("ev")) return "Electric transport, charging and clean mobility.";
  if (value.includes("esg") || value.includes("certif")) return "Standards, verification and sustainability assurance.";
  if (value.includes("tourism") || value.includes("travel")) return "Lower-impact travel and responsible hospitality.";
  if (value.includes("family") || value.includes("care") || value.includes("health")) return "Safer personal care and conscious household essentials.";
  if (value.includes("packag")) return "Reusable, recyclable and compostable packaging.";
  if (value.includes("solar") || value.includes("renewable")) return "Clean power systems for resilient operations.";
  if (value.includes("building") || value.includes("construction")) return "Efficient materials and greener built environments.";
  if (value.includes("agri") || value.includes("food")) return "Responsible inputs and sustainable food systems.";
  if (value.includes("carbon") || value.includes("climate")) return "Measurement, reduction and credible climate action.";
  if (value.includes("energy")) return "Efficient technology for lower energy consumption.";
  if (value.includes("product")) return "Better products designed for a lower environmental impact.";
  return `Explore responsible products and vendors in ${name}.`;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setCategories(await fetchActiveCategories());
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayList = (categories.length > 0 ? categories : STATIC_CATEGORIES).filter((c) =>
    c.name.toLowerCase().includes(searchQ.toLowerCase()),
  );

  return (
    <>
      <style>{`
        .cats-page { min-height: 100vh; background: #f9f9f7; }

        /* ── HERO ── */
        .cats-hero {
          background: linear-gradient(135deg, #0d1f14 0%, #162b1e 60%, #0d1f14 100%);
          padding: 44px 32px 40px;
          position: relative;
          overflow: hidden;
        }
        .cats-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 700px 300px at 70% 50%, rgba(29,185,84,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .cats-hero-inner { max-width: 1140px; margin: 0 auto; position: relative; z-index: 1; }
        .cats-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 20px;
          transition: color 0.18s;
        }
        .cats-back:hover { color: rgba(255,255,255,0.85); }
        .cats-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--g, #1db954);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .cats-hero-title {
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
        }
        .cats-hero-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          margin: 0 0 28px;
          max-width: 520px;
          line-height: 1.6;
        }

        /* ── SEARCH ── */
        .cats-search-wrap {
          position: relative;
          max-width: 460px;
        }
        .cats-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.4);
        }
        .cats-search-input {
          width: 100%;
          height: 46px;
          border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(10px);
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          padding: 0 16px 0 42px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .cats-search-input::placeholder { color: rgba(255,255,255,0.35); }
        .cats-search-input:focus {
          border-color: var(--g, #1db954);
          background: rgba(255,255,255,0.1);
        }

        /* ── CONTENT ── */
        .cats-content {
          max-width: 1140px;
          margin: 0 auto;
          padding: 40px 24px 72px;
        }
        .cats-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .cats-count {
          font-size: 14px;
          color: #666;
        }
        .cats-count strong { color: #111; font-weight: 700; }

        /* ── GRID ── */
        .cats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 18px;
        }
        @media (max-width: 640px) {
          .cats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .cats-hero { padding: 28px 16px 24px; }
          .cats-content { padding: 24px 16px 48px; }
        }
        @media (max-width: 420px) {
          .cats-grid { grid-template-columns: 1fr; }
        }

        /* ── CATEGORY CARD ── */
        .cat-card {
          --cat-surface: #eef8ee;
          --cat-accent: #238636;
          --cat-glow: #bfe7c6;
          min-height: 238px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid #e2e9e4;
          border-radius: 22px;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(18, 46, 32, 0.055);
          transition:
            transform 220ms ease,
            border-color 220ms ease,
            box-shadow 220ms ease;
        }
        
        .cat-card:hover {
          border-color: color-mix(in srgb, var(--cat-accent) 35%, white);
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(18, 46, 32, 0.13);
        }

        .cat-card:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--cat-accent) 35%, transparent);
          outline-offset: 3px;
        }

        .cat-visual {
          width: 100%;
          height: 128px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 18px;
          color: var(--cat-accent);
          background:
            radial-gradient(circle at 88% 15%, var(--cat-glow) 0, transparent 36%),
            linear-gradient(145deg, var(--cat-surface), #fff);
        }

        .cat-visual::after {
          content: "";
          width: 92px;
          height: 92px;
          position: absolute;
          top: -38px;
          right: -24px;
          border: 1px solid color-mix(in srgb, var(--cat-accent) 18%, transparent);
          border-radius: 999px;
        }

        .cat-visual-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 350ms ease;
        }

        .cat-visual-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(7, 24, 14, 0.05), rgba(7, 24, 14, 0.62));
        }
        
        .cat-card:hover .cat-visual-image {
          transform: scale(1.06);
        }

        .cat-icon-box {
          width: 54px;
          height: 54px;
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.78);
          border-radius: 16px;
          color: var(--cat-accent);
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 10px 26px rgba(18, 46, 32, 0.12);
          backdrop-filter: blur(10px);
          transition: transform 220ms ease;
        }

        .cat-card:hover .cat-icon-box {
          transform: translateY(-3px) rotate(-3deg);
        }

        .cat-index {
          position: relative;
          z-index: 1;
          color: color-mix(in srgb, var(--cat-accent) 70%, #20382c);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .cat-card:has(.cat-visual-image) .cat-index {
          color: rgba(255, 255, 255, 0.88);
        }

        .cat-copy {
          min-height: 110px;
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 17px 18px 16px;
        }

        .cat-name {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          color: #14271d;
          font-size: 15px;
          font-weight: 750;
          line-height: 1.35;
          transition: color 180ms ease;
        }

        .cat-card:hover .cat-name {
          color: var(--cat-accent);
        }

        .cat-arrow {
          width: 29px;
          height: 29px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 9px;
          color: var(--cat-accent);
          background: var(--cat-surface);
          transition: transform 180ms ease, background 180ms ease, color 180ms ease;
        }

        .cat-card:hover .cat-arrow {
          color: white;
          background: var(--cat-accent);
          transform: translate(2px, -2px);
        }

        .cat-description {
          display: -webkit-box;
          margin: 8px 0 0;
          overflow: hidden;
          color: #6a7d72;
          font-size: 12px;
          line-height: 1.5;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .cat-count {
          margin-top: auto;
          padding-top: 10px;
          font-size: 11px;
          font-weight: 650;
          color: var(--cat-accent);
        }

        /* ── SKELETON ── */
        .cats-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        .cat-skeleton {
          height: 180px;
          border-radius: 20px;
          background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
          background-size: 400% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: -100% 50%; }
        }

        /* ── EMPTY ── */
        .cats-empty {
          text-align: center;
          padding: 60px 20px;
          color: #888;
        }
        .cats-empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.4; }
        .cats-empty h3 { font-size: 18px; font-weight: 700; color: #555; margin: 0 0 8px; }
        .cats-empty p { font-size: 14px; margin: 0; }
      `}</style>

      <div className="cats-page">
        <Header />

        {/* ── HERO ── */}
        <div className="cats-hero">
          <div className="cats-hero-inner">
            <Link href="/" className="cats-back">
              <FiArrowLeft size={14} /> Back to Home
            </Link>

            <div className="cats-hero-eyebrow">
              <HiOutlineSparkles size={13} /> Browse Platform
            </div>
            <h1 className="cats-hero-title">All Categories</h1>
            <p className="cats-hero-sub">
              Every category is verified, compliance-ready, and built exclusively for
              corporate B2B procurement across India.
            </p>

            <div className="cats-search-wrap">
              <FiSearch size={15} className="cats-search-icon" />
              <input
                type="text"
                className="cats-search-input"
                placeholder="Search categories…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="cats-content">
          <div className="cats-toolbar">
            <p className="cats-count">
              {loading ? "Loading…" : (
                <><strong>{displayList.length}</strong> categories available</>
              )}
            </p>
            <Link
              href="/browse"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--g2, #16a34a)",
                textDecoration: "none",
              }}
            >
              <FiGrid size={13} /> Browse All Products &amp; Vendors
            </Link>
          </div>

          {loading ? (
            <div className="cats-skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="cat-skeleton" />
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="cats-empty">
              <div className="cats-empty-icon"><FiGrid /></div>
              <h3>No categories found</h3>
              <p>Try a different search term.</p>
            </div>
          ) : (
            <div className="cats-grid">
              {displayList.map((category: any, index) => {
                const CategoryIcon = categoryIcon(category.name);
                const theme = CATEGORY_THEMES[index % CATEGORY_THEMES.length];
                const cardStyle = {
                  "--cat-surface": theme.surface,
                  "--cat-accent": theme.accent,
                  "--cat-glow": theme.glow,
                } as CSSProperties;
                const description =
                  category.description ||
                  category.desc ||
                  categoryDescription(category.name);

                return (
                  <Link
                    key={category.id}
                    href={`/browse?category=${category.id}`}
                    className="cat-card"
                    style={cardStyle}
                  >
                    <div className="cat-visual">
                      {category.imageUrl && (
                        <>
                          <img
                            src={category.imageUrl}
                            alt=""
                            className="cat-visual-image"
                          />
                          <span className="cat-visual-shade" />
                        </>
                      )}
                      <span className="cat-icon-box">
                        <CategoryIcon size={27} strokeWidth={1.8} />
                      </span>
                      <span className="cat-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="cat-copy">
                      <div className="cat-name">
                        <span>{category.name}</span>
                        <span className="cat-arrow" aria-hidden="true">
                          <ArrowUpRight size={15} strokeWidth={2.2} />
                        </span>
                      </div>
                      <p className="cat-description">{description}</p>
                      {(category.count || category.vendorCount) && (
                        <div className="cat-count">
                          {category.count || `${category.vendorCount} vendors`}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
