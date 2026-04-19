"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import {
  FiSearch,
  FiSliders,
  FiX,
  FiArrowLeft,
  FiGrid,
  FiList,
  FiPackage,
  FiTool,
  FiUsers,
  FiMapPin,
  FiStar,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiExternalLink,
  FiAward,
  FiCheckCircle,
  FiZap,
  FiTrendingUp,
} from "react-icons/fi";
import {
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { MdOutlineRecycling, MdOutlineEnergySavingsLeaf } from "react-icons/md";

/* ---------------- TYPES ---------------- */
type Product = {
  id: string;
  title?: string;
  description?: string;
  images?: string[];
  listingType?: string;
  categoryId?: string;
  priceType?: string;
  price?: number;
  vendorName?: string;
  ecoScore?: number;
  certifications?: string[];
  tags?: string[];
};

type Vendor = {
  id: string;
  companyName?: string;
  description?: string;
  approved?: boolean;
  category?: string;
  location?: string;
  ecoScore?: number;
  ecoTier?: string;
  brownLensScore?: number;
  certifications?: string[];
  logoText?: string;
};

type Category = {
  id: string;
  name: string;
  imageUrl?: string;
};

interface FilterState {
  ecoTier: string;
  priceRange: string;
  certification: string;
  location: string;
  sortBy: string;
}

const DEFAULT_FILTERS: FilterState = {
  ecoTier: "",
  priceRange: "",
  certification: "",
  location: "",
  sortBy: "newest",
};

/* ================= PAGE ================= */

export default function BrowsePage() {
  const router = useRouter();
  const params = useSearchParams();

  const type = params.get("type") || "Product";
  const category = params.get("category") || "";
  const search = params.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [localSearch, setLocalSearch] = useState(search);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    category: true,
    ecoTier: true,
    price: true,
    certification: false,
    location: false,
  });

  /* ---------------- LOAD CATEGORIES ---------------- */
  useEffect(() => {
    async function loadCategories() {
      try {
        const snap = await getDocs(collection(db, "categories"));
        setCategories(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category),
        );
      } catch (e) {
        console.error("BROWSE_CATEGORIES_ERROR", e);
      }
    }
    loadCategories();
  }, []);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (type === "Product" || type === "Service") {
          let qRef = query(
            collection(db, "products"),
            where("approved", "==", true),
            where("listingType", "==", type),
            orderBy("title"),
            limit(100),
          );

          if (category) {
            qRef = query(qRef, where("categoryId", "==", category));
          }

          const snap = await getDocs(qRef);
          let list = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Product,
          );

          if (search) {
            const s = search.toLowerCase();
            list = list.filter(
              (p) =>
                (p.title || "").toLowerCase().includes(s) ||
                (p.description || "").toLowerCase().includes(s) ||
                (p.tags || []).some((t) => t.toLowerCase().includes(s)),
            );
          }

          // Apply advanced filters
          if (filters.ecoTier) {
            list = list.filter((p) =>
              (p.certifications || []).some((c) =>
                c.toLowerCase().includes(filters.ecoTier.toLowerCase()),
              ),
            );
          }

          if (filters.certification) {
            list = list.filter((p) =>
              (p.certifications || []).some((c) =>
                c.toLowerCase().includes(filters.certification.toLowerCase()),
              ),
            );
          }

          // Sort
          if (filters.sortBy === "eco_score") {
            list = list.sort((a, b) => (b.ecoScore || 0) - (a.ecoScore || 0));
          }

          setTotalCount(list.length);
          setProducts(list);
          setVendors([]);
        }

        if (type === "Vendor") {
          const snap = await getDocs(collection(db, "vendors"));
          let list = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Vendor,
          );

          if (search) {
            const s = search.toLowerCase();
            list = list.filter(
              (v) =>
                (v.companyName || "").toLowerCase().includes(s) ||
                (v.description || "").toLowerCase().includes(s) ||
                (v.category || "").toLowerCase().includes(s),
            );
          }

          // Eco tier filter
          if (filters.ecoTier) {
            list = list.filter(
              (v) =>
                (v.ecoTier || "").toLowerCase() ===
                filters.ecoTier.toLowerCase(),
            );
          }

          // Location filter
          if (filters.location) {
            list = list.filter((v) =>
              (v.location || "")
                .toLowerCase()
                .includes(filters.location.toLowerCase()),
            );
          }

          // Sort
          if (filters.sortBy === "eco_score") {
            list = list.sort((a, b) => (b.ecoScore || 0) - (a.ecoScore || 0));
          }

          setTotalCount(list.length);
          setVendors(list);
          setProducts([]);
        }
      } catch (e) {
        console.error("BROWSE_LOAD_ERROR", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, category, search, filters]);

  /* Sync search from URL */
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  /* Debounced search update to URL */
  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      updateFilter("q", val);
    }, 350);
  };

  function updateFilter(key: string, value: string) {
    const url = new URLSearchParams(params.toString());
    value ? url.set(key, value) : url.delete(key);
    router.push(`/browse?${url.toString()}`);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    router.push(`/browse?type=${type}`);
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function getEcoTierColor(tier?: string) {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return "var(--browse-platinum)";
      case "gold":
        return "var(--browse-gold)";
      case "silver":
        return "var(--browse-silver)";
      case "bronze":
        return "var(--browse-bronze)";
      default:
        return "var(--browse-silver)";
    }
  }

  function getEcoTierBg(tier?: string) {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return "var(--browse-platinum-bg)";
      case "gold":
        return "var(--browse-gold-bg)";
      case "silver":
        return "var(--browse-silver-bg)";
      case "bronze":
        return "var(--browse-bronze-bg)";
      default:
        return "var(--browse-silver-bg)";
    }
  }

  const activeFiltersCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sortBy",
  ).length;

  /* ================= SIDEBAR FILTER PANEL ================= */
  const FilterSidebar = () => (
    <aside className="browse-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <FiFilter className="sidebar-icon" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="filter-badge">{activeFiltersCount}</span>
          )}
        </div>
        <button className="reset-btn" onClick={resetFilters}>
          <FiRefreshCw size={13} />
          Reset
        </button>
      </div>

      {/* TYPE SECTION */}
      <div className="filter-section">
        <button
          className="filter-section-header"
          onClick={() => toggleSection("type")}
        >
          <span>Browse Type</span>
          {expandedSections.type ? (
            <FiChevronUp size={14} />
          ) : (
            <FiChevronDown size={14} />
          )}
        </button>
        {expandedSections.type && (
          <div className="filter-options-col">
            {[
              { val: "Product", label: "Products", icon: FiPackage },
              { val: "Vendor", label: "Vendors", icon: FiUsers },
              { val: "Service", label: "Services", icon: FiTool },
            ].map(({ val, label, icon: Icon }) => (
              <button
                key={val}
                className={`type-pill${type === val ? " active" : ""}`}
                onClick={() => updateFilter("type", val)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CATEGORY SECTION */}
      {(type === "Product" || type === "Service") && (
        <div className="filter-section">
          <button
            className="filter-section-header"
            onClick={() => toggleSection("category")}
          >
            <span>Category</span>
            {expandedSections.category ? (
              <FiChevronUp size={14} />
            ) : (
              <FiChevronDown size={14} />
            )}
          </button>
          {expandedSections.category && (
            <div className="filter-options-col">
              <button
                className={`cat-option${!category ? " active" : ""}`}
                onClick={() => updateFilter("category", "")}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`cat-option${category === c.id ? " active" : ""}`}
                  onClick={() => updateFilter("category", c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ECO TIER */}
      <div className="filter-section">
        <button
          className="filter-section-header"
          onClick={() => toggleSection("ecoTier")}
        >
          <span>Eco Score Tier</span>
          {expandedSections.ecoTier ? (
            <FiChevronUp size={14} />
          ) : (
            <FiChevronDown size={14} />
          )}
        </button>
        {expandedSections.ecoTier && (
          <div className="filter-options-col">
            {[
              { val: "", label: "All Tiers" },
              { val: "platinum", label: "💎 Platinum" },
              { val: "gold", label: "🥇 Gold" },
              { val: "silver", label: "🥈 Silver" },
              { val: "bronze", label: "🥉 Bronze" },
            ].map(({ val, label }) => (
              <button
                key={val}
                className={`cat-option${filters.ecoTier === val ? " active" : ""}`}
                onClick={() => setFilters((f) => ({ ...f, ecoTier: val }))}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LOCATION (vendors only) */}
      {type === "Vendor" && (
        <div className="filter-section">
          <button
            className="filter-section-header"
            onClick={() => toggleSection("location")}
          >
            <span>Location</span>
            {expandedSections.location ? (
              <FiChevronUp size={14} />
            ) : (
              <FiChevronDown size={14} />
            )}
          </button>
          {expandedSections.location && (
            <div className="filter-options-col">
              <input
                type="text"
                placeholder="City or state…"
                value={filters.location}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, location: e.target.value }))
                }
                className="filter-text-input"
              />
            </div>
          )}
        </div>
      )}

      {/* SORT */}
      <div className="filter-section">
        <div className="filter-section-header" style={{ cursor: "default" }}>
          <span>Sort By</span>
        </div>
        <div className="filter-options-col">
          {[
            { val: "newest", label: "Newest First" },
            { val: "eco_score", label: "Eco Score (High → Low)" },
            { val: "name_az", label: "Name A → Z" },
          ].map(({ val, label }) => (
            <button
              key={val}
              className={`cat-option${filters.sortBy === val ? " active" : ""}`}
              onClick={() => setFilters((f) => ({ ...f, sortBy: val }))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );

  /* ================= PRODUCT CARD ================= */
  const ProductCard = ({ p }: { p: Product }) =>
    viewMode === "grid" ? (
      <Link href={`/products/${p.id}`} className="browse-product-card">
        <div className="bpc-img-wrap">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              className="bpc-img"
              alt={p.title || "Product"}
            />
          ) : (
            <div className="bpc-img-placeholder">
              <FiPackage size={32} />
            </div>
          )}
          {p.listingType && (
            <span className="bpc-type-badge">{p.listingType}</span>
          )}
        </div>
        <div className="bpc-body">
          <h3 className="bpc-title">{p.title}</h3>
          {p.description && (
            <p className="bpc-desc">
              {p.description.replace(/<[^>]+>/g, "").slice(0, 80)}…
            </p>
          )}
          <div className="bpc-meta">
            {p.ecoScore && (
              <span className="bpc-eco">
                <HiOutlineSparkles size={12} />
                Eco {p.ecoScore}
              </span>
            )}
            <span className="bpc-price">{p.priceType || "Price on request"}</span>
          </div>
          {(p.certifications || []).length > 0 && (
            <div className="bpc-certs">
              {p.certifications!.slice(0, 2).map((c) => (
                <span key={c} className="bpc-cert-pill">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="bpc-footer">
          <span className="bpc-view-link">
            View Details <FiExternalLink size={11} />
          </span>
        </div>
      </Link>
    ) : (
      <Link href={`/products/${p.id}`} className="browse-product-row">
        <div className="bpr-img-wrap">
          {p.images?.[0] ? (
            <img src={p.images[0]} className="bpr-img" alt={p.title} />
          ) : (
            <div className="bpr-img-placeholder">
              <FiPackage size={20} />
            </div>
          )}
        </div>
        <div className="bpr-body">
          <h3 className="bpc-title" style={{ fontSize: 14 }}>
            {p.title}
          </h3>
          {p.description && (
            <p className="bpc-desc">
              {p.description.replace(/<[^>]+>/g, "").slice(0, 120)}…
            </p>
          )}
          {(p.certifications || []).length > 0 && (
            <div className="bpc-certs">
              {p.certifications!.slice(0, 3).map((c) => (
                <span key={c} className="bpc-cert-pill">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="bpr-right">
          {p.ecoScore && (
            <span className="bpc-eco">
              <HiOutlineSparkles size={12} />
              Eco {p.ecoScore}
            </span>
          )}
          <span className="bpc-price">{p.priceType || "Price on request"}</span>
          <span className="bpc-view-link">
            View Details <FiExternalLink size={11} />
          </span>
        </div>
      </Link>
    );

  /* ================= VENDOR CARD ================= */
  const VendorCard = ({ v }: { v: Vendor }) =>
    viewMode === "grid" ? (
      <Link href={`/find-vendors/${v.id}`} className="browse-vendor-card">
        <div className="bvc-top">
          <div className="bvc-logo">
            {v.logoText || (v.companyName || "V").slice(0, 2).toUpperCase()}
          </div>
          <div className="bvc-badges">
            {v.ecoTier && (
              <span
                className="bvc-tier"
                style={{
                  color: getEcoTierColor(v.ecoTier),
                  background: getEcoTierBg(v.ecoTier),
                }}
              >
                {v.ecoTier.toUpperCase()}
              </span>
            )}
            {v.brownLensScore && (
              <span className="bvc-bl">
                <HiOutlineShieldCheck size={11} />
                BL {v.brownLensScore}/5
              </span>
            )}
          </div>
        </div>
        <div className="bvc-body">
          <h3 className="bvc-name">{v.companyName || "Unnamed Vendor"}</h3>
          {v.category && <p className="bvc-cat">{v.category}</p>}
          {v.description && (
            <p className="bvc-desc">
              {v.description.replace(/<[^>]+>/g, "").slice(0, 90)}…
            </p>
          )}
          {(v.certifications || []).length > 0 && (
            <div className="bpc-certs">
              {v.certifications!.slice(0, 2).map((c) => (
                <span key={c} className="bpc-cert-pill">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        {v.ecoScore && (
          <div className="bvc-score-wrap">
            <div className="bvc-score-label">
              <span>Eco Score</span>
              <span style={{ fontWeight: 700, color: "var(--g)" }}>
                {v.ecoScore}/100
              </span>
            </div>
            <div className="bvc-score-track">
              <div
                className="bvc-score-fill"
                style={{ width: `${v.ecoScore}%` }}
              />
            </div>
          </div>
        )}
        <div className="bvc-footer">
          {v.location && (
            <span className="bvc-loc">
              <FiMapPin size={11} />
              {v.location}
            </span>
          )}
          <span className="bpc-view-link">
            View Profile <FiExternalLink size={11} />
          </span>
        </div>
      </Link>
    ) : (
      <Link href={`/find-vendors/${v.id}`} className="browse-product-row">
        <div className="bvc-logo" style={{ flexShrink: 0, width: 52, height: 52, fontSize: 16 }}>
          {v.logoText || (v.companyName || "V").slice(0, 2).toUpperCase()}
        </div>
        <div className="bpr-body">
          <h3 className="bpc-title" style={{ fontSize: 14 }}>
            {v.companyName}
          </h3>
          {v.category && <p className="bvc-cat">{v.category}</p>}
          {v.description && (
            <p className="bpc-desc">
              {v.description.replace(/<[^>]+>/g, "").slice(0, 120)}…
            </p>
          )}
        </div>
        <div className="bpr-right">
          {v.ecoTier && (
            <span
              className="bvc-tier"
              style={{
                color: getEcoTierColor(v.ecoTier),
                background: getEcoTierBg(v.ecoTier),
              }}
            >
              {v.ecoTier.toUpperCase()}
            </span>
          )}
          {v.location && (
            <span className="bvc-loc">
              <FiMapPin size={11} />
              {v.location}
            </span>
          )}
          <span className="bpc-view-link">
            View Profile <FiExternalLink size={11} />
          </span>
        </div>
      </Link>
    );

  /* ================= SKELETON ================= */
  const Skeleton = () => (
    <div
      className={
        viewMode === "grid"
          ? "browse-grid"
          : "browse-list"
      }
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="browse-skeleton" />
      ))}
    </div>
  );

  /* ================= RENDER ================= */
  return (
    <>
      <style>{`
        /* ========== BROWSE PAGE DESIGN SYSTEM ========== */
        :root {
          --browse-platinum: #a78bfa;
          --browse-platinum-bg: rgba(167,139,250,0.12);
          --browse-gold: #f59e0b;
          --browse-gold-bg: rgba(245,158,11,0.12);
          --browse-silver: #94a3b8;
          --browse-silver-bg: rgba(148,163,184,0.12);
          --browse-bronze: #cd7f32;
          --browse-bronze-bg: rgba(205,127,50,0.12);
        }

        .browse-layout {
          min-height: 100vh;
          background: var(--white, #f9f9f7);
        }

        /* ===== BROWSE HERO BAR ===== */
        .browse-hero-bar {
          background: linear-gradient(135deg, #0d1f14 0%, #162b1e 50%, #0d1f14 100%);
          padding: 36px 32px 32px;
          position: relative;
          overflow: hidden;
        }
        .browse-hero-bar::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(ellipse 600px 300px at 80% 50%, rgba(29,185,84,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .browse-hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .browse-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          text-decoration: none;
          font-weight: 500;
          margin-bottom: 20px;
          transition: color 0.2s;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
        }
        .browse-back-link:hover { color: rgba(255,255,255,0.9); }

        .browse-hero-title {
          font-size: clamp(22px, 3vw, 32px);
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .browse-hero-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin: 0 0 24px;
        }

        /* ===== SEARCH BAR ===== */
        .browse-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 8px 16px;
          max-width: 680px;
          backdrop-filter: blur(10px);
          transition: border-color 0.2s, background 0.2s;
        }
        .browse-search-bar:focus-within {
          border-color: var(--g, #1db954);
          background: rgba(255,255,255,0.09);
        }
        .browse-search-icon { color: rgba(255,255,255,0.4); flex-shrink: 0; }
        .browse-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
        }
        .browse-search-input::placeholder { color: rgba(255,255,255,0.35); }
        .browse-search-clear {
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 6px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .browse-search-clear:hover { background: rgba(255,255,255,0.15); color: #fff; }

        /* Type Tab Pills in hero */
        .browse-type-tabs {
          display: flex;
          gap: 8px;
          margin-top: 18px;
          flex-wrap: wrap;
        }
        .browse-type-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .browse-type-tab:hover {
          border-color: rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.8);
        }
        .browse-type-tab.active {
          background: var(--g, #1db954);
          border-color: var(--g, #1db954);
          color: #fff;
        }

        /* ===== CONTENT WRAPPER ===== */
        .browse-content-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 24px 60px;
          display: flex;
          gap: 28px;
          align-items: flex-start;
        }

        /* ===== SIDEBAR ===== */
        .browse-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 18px;
          padding: 20px;
          position: sticky;
          top: 80px;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
        }
        @media (max-width:900px) {
          .browse-sidebar { display: none; }
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text, #111);
        }
        .sidebar-icon { color: var(--g, #1db954); }
        .filter-badge {
          background: var(--g, #1db954);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 50px;
          padding: 1px 6px;
        }
        .reset-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--text3, #888);
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.15s;
        }
        .reset-btn:hover { color: #e53e3e; }

        .filter-section {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding: 12px 0;
        }
        .filter-section:last-child { border-bottom: none; }
        .filter-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          color: var(--text, #111);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0 0 8px;
          font-family: inherit;
        }
        .filter-options-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .type-pill, .cat-option {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text2, #444);
          text-align: left;
          width: 100%;
          font-family: inherit;
          transition: background 0.12s, color 0.12s;
        }
        .type-pill:hover, .cat-option:hover {
          background: rgba(29,185,84,0.07);
          color: var(--g, #1db954);
        }
        .type-pill.active, .cat-option.active {
          background: rgba(29,185,84,0.12);
          color: var(--g, #1db954);
          font-weight: 700;
        }
        .filter-text-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          color: var(--text, #111);
          transition: border-color 0.15s;
        }
        .filter-text-input:focus { border-color: var(--g, #1db954); }

        /* ===== MAIN CONTENT ===== */
        .browse-main {
          flex: 1;
          min-width: 0;
        }
        .browse-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .browse-count {
          font-size: 14px;
          color: var(--text2, #555);
          font-weight: 500;
        }
        .browse-count strong { color: var(--text, #111); font-weight: 700; }
        .browse-view-toggle {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.05);
          border-radius: 8px;
          padding: 3px;
        }
        .browse-view-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          color: var(--text3, #888);
          transition: all 0.15s;
        }
        .browse-view-btn.active {
          background: #fff;
          color: var(--g, #1db954);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .browse-mobile-filter-btn {
          display: none;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 50px;
          border: 1.5px solid rgba(0,0,0,0.12);
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          color: var(--text, #111);
        }
        @media (max-width: 900px) {
          .browse-mobile-filter-btn { display: flex; }
        }

        /* ===== GRIDS ===== */
        .browse-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }
        .browse-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .browse-vendor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 18px;
        }

        /* ===== PRODUCT CARD ===== */
        .browse-product-card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .browse-product-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .bpc-img-wrap {
          position: relative;
          height: 200px;
          background: rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .bpc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .browse-product-card:hover .bpc-img { transform: scale(1.04); }
        .bpc-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0,0,0,0.2);
        }
        .bpc-type-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 50px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .bpc-body {
          padding: 14px 14px 8px;
          flex: 1;
        }
        .bpc-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text, #111);
          margin: 0 0 5px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bpc-desc {
          font-size: 12px;
          color: var(--text3, #888);
          line-height: 1.55;
          margin: 0 0 8px;
        }
        .bpc-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bpc-eco {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: var(--g2, #16a34a);
          background: rgba(29,185,84,0.1);
          padding: 3px 8px;
          border-radius: 50px;
        }
        .bpc-price {
          font-size: 12px;
          font-weight: 600;
          color: var(--text2, #555);
        }
        .bpc-certs {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .bpc-cert-pill {
          font-size: 10px;
          font-weight: 600;
          color: var(--text2, #555);
          background: rgba(0,0,0,0.05);
          padding: 2px 7px;
          border-radius: 50px;
        }
        .bpc-footer {
          padding: 8px 14px 12px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .bpc-view-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          color: var(--g2, #16a34a);
          text-decoration: none;
        }

        /* LIST ROW */
        .browse-product-row {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          text-decoration: none;
          transition: box-shadow 0.18s;
        }
        .browse-product-row:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .bpr-img-wrap {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          background: rgba(0,0,0,0.05);
          overflow: hidden;
          flex-shrink: 0;
        }
        .bpr-img { width: 100%; height: 100%; object-fit: cover; }
        .bpr-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0,0,0,0.2);
        }
        .bpr-body { flex: 1; min-width: 0; }
        .bpr-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }

        /* ===== VENDOR CARD ===== */
        .browse-vendor-card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .browse-vendor-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .bvc-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .bvc-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--g, #1db954), var(--g2, #16a34a));
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bvc-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .bvc-tier {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 50px;
        }
        .bvc-bl {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 600;
          color: var(--g2, #16a34a);
          background: rgba(29,185,84,0.1);
          padding: 3px 7px;
          border-radius: 50px;
        }
        .bvc-body { flex: 1; }
        .bvc-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text, #111);
          margin: 0 0 3px;
        }
        .bvc-cat {
          font-size: 11px;
          color: var(--text3, #888);
          margin: 0 0 6px;
        }
        .bvc-desc {
          font-size: 12px;
          color: var(--text2, #555);
          line-height: 1.55;
          margin: 0;
        }
        .bvc-score-wrap { margin-top: 4px; }
        .bvc-score-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text3, #888);
          margin-bottom: 4px;
        }
        .bvc-score-track {
          height: 5px;
          background: rgba(0,0,0,0.07);
          border-radius: 50px;
          overflow: hidden;
        }
        .bvc-score-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--g, #1db954), var(--g2, #16a34a));
          border-radius: 50px;
          transition: width 0.6s ease;
        }
        .bvc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 10px;
          margin-top: 4px;
        }
        .bvc-loc {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text3, #888);
          font-weight: 500;
        }

        /* ===== SKELETON ===== */
        .browse-skeleton {
          height: 280px;
          border-radius: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
          background-size: 400% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: -100% 50%; }
        }

        /* ===== EMPTY STATE ===== */
        .browse-empty {
          text-align: center;
          padding: 64px 24px;
          color: var(--text3, #888);
        }
        .browse-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.4;
        }
        .browse-empty h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text2, #555);
          margin: 0 0 8px;
        }
        .browse-empty p { font-size: 14px; margin: 0; }

        /* ===== MOBILE FILTER DRAWER ===== */
        .mobile-filter-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 100;
          animation: fadeIn 0.15s ease;
        }
        .mobile-filter-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 288px;
          background: #fff;
          z-index: 101;
          overflow-y: auto;
          padding: 24px;
          animation: slideInLeft 0.2s ease;
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mobile-filter-close {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-bottom: 12px;
        }
        .mobile-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(0,0,0,0.05);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text, #111);
        }

        @media (max-width: 640px) {
          .browse-content-wrap { padding: 20px 16px 48px; }
          .browse-hero-bar { padding: 24px 16px 20px; }
          .browse-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>

      <div className="browse-layout">
        <Header />

        {/* ===== HERO BAR ===== */}
        <div className="browse-hero-bar">
          <div className="browse-hero-inner">
            <Link href="/" className="browse-back-link">
              <FiArrowLeft size={14} />
              Back to Home
            </Link>

            <h1 className="browse-hero-title">Browse Marketplace</h1>
            <p className="browse-hero-sub">
              Discover ESG-verified vendors, products &amp; services across
              India
            </p>

            {/* Search bar */}
            <div className="browse-search-bar">
              <FiSearch size={17} className="browse-search-icon" />
              <input
                type="text"
                className="browse-search-input"
                placeholder={
                  type === "Vendor"
                    ? "Search vendors by name, category, location…"
                    : type === "Service"
                      ? "Search services…"
                      : "Search products by name, tag, certification…"
                }
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoComplete="off"
              />
              {localSearch && (
                <button
                  className="browse-search-clear"
                  onClick={() => handleSearchChange("")}
                >
                  <FiX size={12} />
                </button>
              )}
            </div>

            {/* Type tabs */}
            <div className="browse-type-tabs">
              {[
                { val: "Product", label: "Products", icon: FiPackage },
                { val: "Vendor", label: "Vendors", icon: FiUsers },
                { val: "Service", label: "Services", icon: FiTool },
              ].map(({ val, label, icon: Icon }) => (
                <button
                  key={val}
                  className={`browse-type-tab${type === val ? " active" : ""}`}
                  onClick={() => updateFilter("type", val)}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="browse-content-wrap">
          {/* Sidebar */}
          <FilterSidebar />

          {/* Main */}
          <main className="browse-main">
            {/* Toolbar */}
            <div className="browse-toolbar">
              <div className="browse-count">
                {loading ? (
                  "Loading…"
                ) : (
                  <>
                    <strong>{totalCount}</strong>{" "}
                    {type === "Vendor"
                      ? "vendors"
                      : type === "Service"
                        ? "services"
                        : "products"}{" "}
                    found
                    {search && (
                      <>
                        {" "}
                        for &ldquo;<strong>{search}</strong>&rdquo;
                      </>
                    )}
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="browse-mobile-filter-btn"
                  onClick={() => setFiltersOpen(true)}
                >
                  <FiSliders size={14} />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="filter-badge">{activeFiltersCount}</span>
                  )}
                </button>
                <div className="browse-view-toggle">
                  <button
                    className={`browse-view-btn${viewMode === "grid" ? " active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                  >
                    <FiGrid size={14} />
                  </button>
                  <button
                    className={`browse-view-btn${viewMode === "list" ? " active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title="List view"
                  >
                    <FiList size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && <Skeleton />}

            {/* Products / Services */}
            {!loading && (type === "Product" || type === "Service") && (
              <>
                {products.length === 0 ? (
                  <div className="browse-empty">
                    <div className="browse-empty-icon">
                      <FiPackage />
                    </div>
                    <h3>No {type.toLowerCase()}s found</h3>
                    <p>
                      Try adjusting your search or filters to find what
                      you&apos;re looking for.
                    </p>
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === "grid" ? "browse-grid" : "browse-list"
                    }
                  >
                    {products.map((p) => (
                      <ProductCard key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Vendors */}
            {!loading && type === "Vendor" && (
              <>
                {vendors.length === 0 ? (
                  <div className="browse-empty">
                    <div className="browse-empty-icon">
                      <FiUsers />
                    </div>
                    <h3>No vendors found</h3>
                    <p>
                      Try adjusting your search or filters to discover verified
                      suppliers.
                    </p>
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === "grid"
                        ? "browse-vendor-grid"
                        : "browse-list"
                    }
                  >
                    {vendors.map((v) => (
                      <VendorCard key={v.id} v={v} />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* Mobile filter drawer */}
        {filtersOpen && (
          <>
            <div
              className="mobile-filter-overlay"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="mobile-filter-drawer">
              <div className="mobile-filter-close">
                <button
                  className="mobile-close-btn"
                  onClick={() => setFiltersOpen(false)}
                >
                  <FiX size={16} />
                </button>
              </div>
              <FilterSidebar />
            </div>
          </>
        )}

        <Footer />
      </div>
    </>
  );
}
