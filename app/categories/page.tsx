"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import { FiArrowLeft, FiArrowRight, FiGrid, FiSearch } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";

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

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, "categories"), where("active", "==", true)),
        );
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Category[];
        setCategories(data.length > 0 ? data : []);
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
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        @media (max-width: 640px) {
          .cats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .cats-hero { padding: 28px 16px 24px; }
          .cats-content { padding: 24px 16px 48px; }
        }

        /* ── CARD ── */
        .cat-full-card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 20px;
          padding: 22px 20px;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          position: relative;
          overflow: hidden;
        }
        .cat-full-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(29,185,84,0.04) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .cat-full-card:hover {
          box-shadow: 0 10px 36px rgba(0,0,0,0.1);
          transform: translateY(-3px);
          border-color: rgba(29,185,84,0.25);
        }
        .cat-full-card:hover::before { opacity: 1; }

        .cfc-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(29,185,84,0.05) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .cfc-icon-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cfc-name {
          font-size: 15px;
          font-weight: 700;
          color: #111;
          margin: 0;
          line-height: 1.3;
        }
        .cfc-desc {
          font-size: 12.5px;
          color: #666;
          line-height: 1.55;
          margin: 0;
          flex: 1;
        }
        .cfc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .cfc-count {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--g2, #16a34a);
          background: rgba(29,185,84,0.09);
          padding: 3px 9px;
          border-radius: 50px;
        }
        .cfc-arrow {
          color: var(--g2, #16a34a);
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s, transform 0.18s;
        }
        .cat-full-card:hover .cfc-arrow {
          opacity: 1;
          transform: translateX(0);
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
              {displayList.map((c: any) => (
                <div
                  key={c.id}
                  className="cat-full-card"
                  onClick={() => router.push(`/browse?category=${c.id}`)}
                >
                  <div className="cfc-icon-wrap">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} />
                    ) : (
                      c.icon || "🌿"
                    )}
                  </div>
                  <h3 className="cfc-name">{c.name}</h3>
                  {(c.desc || c.description) && (
                    <p className="cfc-desc">{c.desc || c.description}</p>
                  )}
                  <div className="cfc-footer">
                    {(c.count || c.vendorCount) && (
                      <span className="cfc-count">
                        {c.count || `${c.vendorCount} vendors`}
                      </span>
                    )}
                    <FiArrowRight size={15} className="cfc-arrow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
