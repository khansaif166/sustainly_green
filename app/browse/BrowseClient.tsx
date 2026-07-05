"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import {
  fetchActiveCategories,
  fetchApprovedProducts,
  fetchApprovedVendors,
  type PublicVendor,
} from "@/lib/supabasePublic";
import {
  FiSearch, FiX, FiArrowLeft, FiGrid, FiList, FiPackage,
  FiTool, FiUsers, FiMapPin, FiFilter, FiChevronDown,
  FiChevronUp, FiRefreshCw, FiExternalLink, FiSliders,
} from "react-icons/fi";
import { HiOutlineSparkles, HiOutlineShieldCheck } from "react-icons/hi2";

/* ---------------- TYPES ---------------- */
type Product = {
  id: string; title?: string; description?: string; images?: string[];
  listingType?: string; categoryId?: string; priceType?: string;
  price?: number; vendorName?: string; ecoScore?: number;
  certifications?: string[]; tags?: string[];
};
type Vendor = PublicVendor & { GreenLensScore?: number };
type Category = { id: string; name: string; imageUrl?: string };
interface FilterState { badge: string; location: string; sortBy: string; }
const DEFAULT_FILTERS: FilterState = { badge: "", location: "", sortBy: "newest" };

const BADGES = [
  { val: "", label: "All Badges", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  { val: "verified", label: "Verified", color: "#15803d", bg: "rgba(22,163,74,0.12)" },
  { val: "approved", label: "Approved", color: "#0369a1", bg: "rgba(3,105,161,0.1)" },
  { val: "listed", label: "Listed", color: "#b45309", bg: "rgba(180,83,9,0.1)" },
  { val: "claim_requested", label: "Claim Requested", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
];

function badgeStyle(badge?: string) {
  const t = BADGES.find(e => e.val === badge?.toLowerCase());
  return t ? { color: t.color, background: t.bg } : { color: "#64748b", background: "rgba(100,116,135,0.1)" };
}

function vt(v: unknown, fb = "") {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fb;
}

function vendorBadge(v: Vendor) {
  if (v.isClaimRequested) return "claim_requested";
  if (v.isUnclaimed) return "listed";
  if (v.listingVerified) return "verified";
  return "approved";
}

function vendorBadgeLabel(v: Vendor) {
  const badge = BADGES.find((item) => item.val === vendorBadge(v));
  return badge?.label || "Approved";
}

function vendorSearchText(v: Vendor) {
  return [
    v.companyName,
    v.description,
    v.category,
    v.location,
    v.city,
    v.state,
    v.country,
    ...(v.subCategories || []),
  ].map((value) => vt(value)).join(" ").toLowerCase();
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function BrowsePage() {
  const router = useRouter();
  const params = useSearchParams();

  const typeParam = params.get("type") || "Product";
  const type = typeParam.toLowerCase() === "vendor" ? "Vendor" : typeParam.toLowerCase() === "service" ? "Service" : "Product";
  const category = params.get("category") || "";
  const search = params.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [localSearch, setLocalSearch] = useState(search);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [expanded, setExpanded] = useState({ type: true, category: true, eco: true, location: false, sort: true });

  useEffect(() => {
    fetchActiveCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (type !== "Vendor") {
          let list: Product[] = await fetchApprovedProducts({ listingType: type, categoryId: category || undefined, limit: 100 });
          if (search) {
            const s = search.toLowerCase();
            list = list.filter(p => (p.title || "").toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s) || (p.tags || []).some(t => t.toLowerCase().includes(s)));
          }
          if (filters.badge) list = list.filter(p => (p.certifications || []).some(c => c.toLowerCase().includes(filters.badge)));
          if (filters.sortBy === "eco_score") list = list.sort((a, b) => (b.ecoScore || 0) - (a.ecoScore || 0));
          setProducts(list); setVendors([]); setTotalCount(list.length);
        } else {
          let list: Vendor[] = await fetchApprovedVendors();
          if (search) { const s = search.toLowerCase(); list = list.filter(v => vendorSearchText(v).includes(s)); }
          if (filters.badge) list = list.filter(v => vendorBadge(v) === filters.badge);
          if (filters.location) {
            const loc = filters.location.toLowerCase();
            list = list.filter(v => [v.location, v.city, v.state, v.country].map(value => vt(value)).join(" ").toLowerCase().includes(loc));
          }
          if (filters.sortBy === "eco_score") list = list.sort((a, b) => (b.ecoScore || 0) - (a.ecoScore || 0));
          setVendors(list); setProducts([]); setTotalCount(list.length);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, [type, category, search, filters]);

  useEffect(() => { setLocalSearch(search); }, [search]);

  function handleSearch(val: string) {
    setLocalSearch(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => updateUrl("q", val), 350);
  }

  function updateUrl(key: string, value: string) {
    const url = new URLSearchParams(params.toString());
    value ? url.set(key, value) : url.delete(key);
    router.push(`/browse?${url.toString()}`);
  }

  function resetAll() { setFilters(DEFAULT_FILTERS); router.push(`/browse?type=${type}`); }

  const activeCount = [filters.badge, filters.location].filter(Boolean).length;

  /* ---- Sidebar ---- */
  const Sidebar = () => (
    <aside className="bs-sidebar">
      <div className="bs-sb-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiFilter size={15} style={{ color: "#16a34a" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Filters</span>
          {activeCount > 0 && <span className="bs-badge">{activeCount}</span>}
        </div>
        <button className="bs-reset" onClick={resetAll}><FiRefreshCw size={12} />Reset</button>
      </div>

      {/* Browse Type */}
      <div className="bs-section">
        <button className="bs-section-btn" onClick={() => setExpanded(e => ({ ...e, type: !e.type }))}>
          <span>Browse Type</span>{expanded.type ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
        </button>
        {expanded.type && (
          <div className="bs-opts">
            {[{ val: "Product", label: "Products", icon: FiPackage }, { val: "Vendor", label: "Vendors", icon: FiUsers }, { val: "Service", label: "Services", icon: FiTool }].map(({ val, label, icon: Icon }) => (
              <button key={val} className={`bs-opt${type === val ? " bs-opt-active" : ""}`} onClick={() => updateUrl("type", val)}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      {type !== "Vendor" && (
        <div className="bs-section">
          <button className="bs-section-btn" onClick={() => setExpanded(e => ({ ...e, category: !e.category }))}>
            <span>Category</span>{expanded.category ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          </button>
          {expanded.category && (
            <div className="bs-opts">
              <button className={`bs-opt${!category ? " bs-opt-active" : ""}`} onClick={() => updateUrl("category", "")}>All Categories</button>
              {categories.map(c => (
                <button key={c.id} className={`bs-opt${category === c.id ? " bs-opt-active" : ""}`} onClick={() => updateUrl("category", c.id)}>{c.name}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Badge */}
      <div className="bs-section">
        <button className="bs-section-btn" onClick={() => setExpanded(e => ({ ...e, eco: !e.eco }))}>
          <span>Badges</span>{expanded.eco ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
        </button>
        {expanded.eco && (
          <div className="bs-opts">
            {BADGES.map(({ val, label }) => (
              <button key={val} className={`bs-opt${filters.badge === val ? " bs-opt-active" : ""}`} onClick={() => setFilters(f => ({ ...f, badge: val }))}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Location (vendors) */}
      {type === "Vendor" && (
        <div className="bs-section">
          <button className="bs-section-btn" onClick={() => setExpanded(e => ({ ...e, location: !e.location }))}>
            <span>Location</span>{expanded.location ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          </button>
          {expanded.location && (
            <div className="bs-opts">
              <input type="text" placeholder="City or state…" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} className="bs-text-input" />
            </div>
          )}
        </div>
      )}

      {/* Sort */}
      <div className="bs-section" style={{ borderBottom: "none" }}>
        <button className="bs-section-btn" onClick={() => setExpanded(e => ({ ...e, sort: !e.sort }))}>
          <span>Sort By</span>{expanded.sort ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
        </button>
        {expanded.sort && (
          <div className="bs-opts">
            {[{ val: "newest", label: "Newest First" }, { val: "eco_score", label: "Eco Score ↓" }, { val: "name_az", label: "Name A → Z" }].map(({ val, label }) => (
              <button key={val} className={`bs-opt${filters.sortBy === val ? " bs-opt-active" : ""}`} onClick={() => setFilters(f => ({ ...f, sortBy: val }))}>{label}</button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  /* ---- Product Card ---- */
  const ProductCard = ({ p }: { p: Product }) => viewMode === "grid" ? (
    <Link href={`/products/${p.id}`} className="bs-card">
      <div className="bs-card-img">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.title || ""} className="bs-card-img-el" />
          : <div className="bs-card-img-ph"><FiPackage size={28} /></div>}
        {p.listingType && <span className="bs-card-badge">{p.listingType}</span>}
        {p.ecoScore && <span className="bs-card-eco"><HiOutlineSparkles size={11} />{p.ecoScore}</span>}
      </div>
      <div className="bs-card-body">
        <p className="bs-card-vendor">{p.vendorName || "Sustainly Vendor"}</p>
        <h3 className="bs-card-title">{p.title}</h3>
        {p.description && <p className="bs-card-desc">{p.description.replace(/<[^>]+>/g, "").slice(0, 75)}…</p>}
        {(p.certifications || []).length > 0 && (
          <div className="bs-card-tags">
            {p.certifications!.slice(0, 2).map(c => <span key={c} className="bs-tag">{c}</span>)}
          </div>
        )}
      </div>
      <div className="bs-card-foot">
        <span className="bs-card-price">{p.priceType || "Price on request"}</span>
        <span className="bs-view-cta">View <FiExternalLink size={10} /></span>
      </div>
    </Link>
  ) : (
    <Link href={`/products/${p.id}`} className="bs-row">
      <div className="bs-row-thumb">
        {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="bs-row-img" /> : <div className="bs-row-ph"><FiPackage size={18} /></div>}
      </div>
      <div className="bs-row-body">
        <p className="bs-card-vendor" style={{ marginBottom: 2 }}>{p.vendorName || "Sustainly Vendor"}</p>
        <h3 className="bs-row-title">{p.title}</h3>
        {p.description && <p className="bs-card-desc">{p.description.replace(/<[^>]+>/g, "").slice(0, 110)}…</p>}
        {(p.certifications || []).length > 0 && (
          <div className="bs-card-tags" style={{ marginTop: 6 }}>
            {p.certifications!.slice(0, 3).map(c => <span key={c} className="bs-tag">{c}</span>)}
          </div>
        )}
      </div>
      <div className="bs-row-right">
        {p.ecoScore && <span className="bs-card-eco"><HiOutlineSparkles size={11} />{p.ecoScore}</span>}
        <span className="bs-card-price">{p.priceType || "On request"}</span>
        <span className="bs-view-cta">View <FiExternalLink size={10} /></span>
      </div>
    </Link>
  );

  /* ---- Vendor Card ---- */
  const logoInitials = (v: Vendor) => (typeof v.logoText === "string" && v.logoText.trim() ? v.logoText : (vt(v.companyName, "V").slice(0, 2) || "V")).toUpperCase();

  const VendorCard = ({ v }: { v: Vendor }) => viewMode === "grid" ? (
    <Link href={`/find-vendors/${v.id}`} className="bs-card bs-vendor-card">
      <div className="bs-vc-head">
        <div className="bs-vc-logo">
          {v.logoUrl ? <img src={v.logoUrl} alt={vt(v.companyName)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} /> : logoInitials(v)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="bs-vc-name">{vt(v.companyName, "Unnamed Vendor")}</h3>
          {v.category && <p className="bs-vc-cat">{vt(v.category)}</p>}
        </div>
        <span className="bs-vc-tier" style={badgeStyle(vendorBadge(v))}>{vendorBadgeLabel(v)}</span>
      </div>

      {v.description && <p className="bs-card-desc">{vt(v.description).replace(/<[^>]+>/g, "").slice(0, 100)}…</p>}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginTop: 8 }}>
        {(typeof v.GreenLensScore === "number" || typeof v.GreenLensScore === "string") && (
          <span className="bs-tag bs-tag-green"><HiOutlineShieldCheck size={10} />BL {vt(v.GreenLensScore)}/5</span>
        )}
        {(v.subCategories || []).slice(0, 3).map((item, i) => <span key={`sub-${i}`} className="bs-tag">{vt(item)}</span>)}
        {(v.certifications || []).slice(0, 2).map((c, i) => <span key={i} className="bs-tag">{vt(c)}</span>)}
      </div>

      {typeof v.ecoScore === "number" && (
        <div className="bs-vc-score">
          <div className="bs-vc-score-row">
            <span>Eco Score</span><span style={{ fontWeight: 700, color: "#16a34a" }}>{v.ecoScore}/100</span>
          </div>
          <div className="bs-vc-track"><div className="bs-vc-fill" style={{ width: `${v.ecoScore}%` }} /></div>
        </div>
      )}

      <div className="bs-vc-foot">
        {(v.state || v.location) && <span className="bs-vc-loc"><FiMapPin size={11} />{vt(v.state || v.location)}</span>}
        <span className="bs-view-cta">{v.isUnclaimed ? "View Listing" : "View Profile"} <FiExternalLink size={10} /></span>
      </div>
    </Link>
  ) : (
    <Link href={`/find-vendors/${v.id}`} className="bs-row">
      <div className="bs-vc-logo" style={{ width: 52, height: 52, fontSize: 16, flexShrink: 0, borderRadius: 12 }}>
        {v.logoUrl ? <img src={v.logoUrl} alt={vt(v.companyName)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} /> : logoInitials(v)}
      </div>
      <div className="bs-row-body">
        <h3 className="bs-row-title">{vt(v.companyName, "Unnamed Vendor")}</h3>
        {v.category && <p className="bs-card-vendor" style={{ marginBottom: 4 }}>{vt(v.category)}</p>}
        {(v.subCategories || []).length > 0 && (
          <div className="bs-card-tags" style={{ marginTop: 6 }}>
            {v.subCategories!.slice(0, 3).map((item, i) => <span key={i} className="bs-tag">{vt(item)}</span>)}
          </div>
        )}
        {v.description && <p className="bs-card-desc">{vt(v.description).replace(/<[^>]+>/g, "").slice(0, 110)}…</p>}
      </div>
      <div className="bs-row-right">
        <span className="bs-vc-tier" style={badgeStyle(vendorBadge(v))}>{vendorBadgeLabel(v)}</span>
        {(v.state || v.location) && <span className="bs-vc-loc"><FiMapPin size={11} />{vt(v.state || v.location)}</span>}
        <span className="bs-view-cta">{v.isUnclaimed ? "View Listing" : "View Profile"} <FiExternalLink size={10} /></span>
      </div>
    </Link>
  );

  const gridClass = type === "Vendor" ? "bs-vendor-grid" : "bs-grid";
  const items = type === "Vendor" ? vendors : products;
  const isEmpty = !loading && items.length === 0;

  /* ============================================================ RENDER */
  return (
    <>
      <style>{`
        /* ── BASE ── */
        .bs-page { min-height: 100vh; background: #f6f7f5; max-width: 100%; overflow-x: hidden; }

        /* ── HERO ── */
        .bs-hero {
          background: linear-gradient(145deg, #0a1a10 0%, #0f2318 40%, #0c1e13 100%);
          padding: 40px 24px 32px;
          position: relative;
          overflow: hidden;
          max-width: 100%;
        }
        .bs-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 700px 400px at 85% 60%, rgba(22,163,74,0.12) 0%, transparent 65%),
            radial-gradient(ellipse 400px 300px at 10% 40%, rgba(29,185,84,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .bs-hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          min-width: 0;
        }
        .bs-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 500;
          text-decoration: none; margin-bottom: 24px;
          transition: color .18s;
        }
        .bs-back:hover { color: rgba(255,255,255,0.85); }
        .bs-hero-h { font-size: clamp(26px,3.5vw,38px); font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -.03em; line-height: 1.1; }
        .bs-hero-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin: 0 0 28px; }

        /* search */
        .bs-search-wrap {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 16px; padding: 12px 18px;
          max-width: 640px;
          min-width: 0;
          backdrop-filter: blur(12px);
          transition: border-color .2s, background .2s;
        }
        .bs-search-wrap:focus-within { border-color: #1db954; background: rgba(255,255,255,0.1); }
        .bs-search-icon { color: rgba(255,255,255,0.35); flex-shrink: 0; }
        .bs-search-in {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 15px; font-family: inherit;
          min-width: 0;
        }
        .bs-search-in::placeholder { color: rgba(255,255,255,0.3); }
        .bs-search-clear {
          width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: background .15s;
        }
        .bs-search-clear:hover { background: rgba(255,255,255,0.2); color: #fff; }

        /* type tabs */
        .bs-tabs { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
        .bs-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 600;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
          cursor: pointer; transition: all .2s; text-decoration: none;
        }
        .bs-tab:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.08); }
        .bs-tab.bs-tab-active { background: #16a34a; border-color: #16a34a; color: #fff; }

        /* ── CONTENT WRAP ── */
        .bs-wrap {
          max-width: 1200px; margin: 0 auto;
          padding: 28px 24px 72px;
          display: flex; gap: 24px; align-items: flex-start;
          min-width: 0;
          width: 100%;
        }

        /* ── SIDEBAR ── */
        .bs-sidebar {
          width: 228px; flex-shrink: 0;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 20px; padding: 18px;
          position: sticky; top: 84px;
          max-height: calc(100vh - 104px);
          overflow-y: auto;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        @media (max-width:900px) { .bs-sidebar { display: none; } }
        .bs-sb-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; padding-bottom: 12px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }
        .bs-badge {
          background: #16a34a; color: #fff; font-size: 10px;
          font-weight: 700; border-radius: 50px; padding: 1px 6px;
        }
        .bs-reset {
          display: flex; align-items: center; gap: 4px;
          font-size: 11.5px; color: #9ca3af;
          background: none; border: none; cursor: pointer; font-family: inherit;
          transition: color .15s;
        }
        .bs-reset:hover { color: #ef4444; }
        .bs-section { border-bottom: 1px solid rgba(0,0,0,0.06); padding: 10px 0; }
        .bs-section-btn {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; background: none; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; color: #374151;
          letter-spacing: .05em; text-transform: uppercase;
          padding: 0 0 8px; font-family: inherit;
        }
        .bs-opts { display: flex; flex-direction: column; gap: 2px; }
        .bs-opt {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 9px; border-radius: 8px; font-size: 13px;
          font-weight: 500; border: none; background: none; cursor: pointer;
          color: #4b5563; text-align: left; width: 100%; font-family: inherit;
          transition: background .12s, color .12s;
        }
        .bs-opt:hover { background: rgba(22,163,74,0.07); color: #15803d; }
        .bs-opt-active { background: rgba(22,163,74,0.1) !important; color: #15803d !important; font-weight: 700 !important; }
        .bs-text-input {
          width: 100%; padding: 7px 10px; border: 1.5px solid rgba(0,0,0,0.1);
          border-radius: 8px; font-size: 13px; font-family: inherit;
          outline: none; color: #111; transition: border-color .15s; box-sizing: border-box;
        }
        .bs-text-input:focus { border-color: #16a34a; }

        /* ── MAIN ── */
        .bs-main { flex: 1; min-width: 0; }
        .bs-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .bs-count { font-size: 14px; color: #6b7280; font-weight: 500; }
        .bs-count strong { color: #111; font-weight: 700; }
        .bs-toolbar-right { display: flex; align-items: center; gap: 10px; }
        .bs-mobile-filter {
          display: none; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 50px;
          border: 1.5px solid rgba(0,0,0,0.12); background: #fff;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; color: #111;
        }
        @media (max-width:900px) { .bs-mobile-filter { display: flex; } }
        .bs-view-toggle {
          display: flex; gap: 3px;
          background: rgba(0,0,0,0.06); border-radius: 10px; padding: 3px;
        }
        .bs-view-btn {
          width: 32px; height: 32px; border-radius: 7px; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          background: none; color: #9ca3af; transition: all .15s;
        }
        .bs-view-btn-active { background: #fff !important; color: #16a34a !important; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

        /* active filter chips */
        .bs-active-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .bs-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 50px;
          background: rgba(22,163,74,0.1); color: #15803d;
          font-size: 12px; font-weight: 600; border: none; cursor: pointer; font-family: inherit;
          transition: background .15s;
        }
        .bs-chip:hover { background: rgba(22,163,74,0.18); }

        /* ── GRIDS ── */
        .bs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
        .bs-vendor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(272px, 1fr)); gap: 16px; }
        .bs-list-mode { display: flex; flex-direction: column; gap: 10px; }

        /* ── PRODUCT CARD ── */
        .bs-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 18px; overflow: hidden;
          text-decoration: none; display: flex; flex-direction: column;
          transition: box-shadow .2s, transform .2s;
        }
        .bs-card:hover { box-shadow: 0 10px 36px rgba(0,0,0,0.12); transform: translateY(-3px); }
        .bs-card-img {
          position: relative; height: 188px;
          background: linear-gradient(135deg, #f0f9f4, #e8f5ec);
          overflow: hidden; flex-shrink: 0;
        }
        .bs-card-img-el { width: 100%; height: 100%; object-fit: cover; transition: transform .35s; }
        .bs-card:hover .bs-card-img-el { transform: scale(1.05); }
        .bs-card-img-ph {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center; color: #9ca3af;
        }
        .bs-card-badge {
          position: absolute; top: 10px; left: 10px;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
          color: #fff; font-size: 9.5px; font-weight: 700;
          padding: 3px 9px; border-radius: 50px; letter-spacing: .05em; text-transform: uppercase;
        }
        .bs-card-eco {
          position: absolute; top: 10px; right: 10px;
          display: flex; align-items: center; gap: 3px;
          background: rgba(22,163,74,0.9); backdrop-filter: blur(6px);
          color: #fff; font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 50px;
        }
        .bs-card-body { padding: 14px 14px 10px; flex: 1; }
        .bs-card-vendor { font-size: 11px; color: #9ca3af; font-weight: 500; margin: 0 0 3px; }
        .bs-card-title {
          font-size: 14px; font-weight: 700; color: #111; margin: 0 0 5px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .bs-card-desc { font-size: 12px; color: #9ca3af; line-height: 1.55; margin: 0; }
        .bs-card-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; }
        .bs-tag {
          font-size: 10.5px; font-weight: 600; color: #4b5563;
          background: #f3f4f6; padding: 2px 8px; border-radius: 50px; display: inline-flex; align-items: center; gap: 3px;
        }
        .bs-tag-green { background: rgba(22,163,74,0.1); color: #15803d; }
        .bs-card-foot {
          padding: 10px 14px 13px;
          border-top: 1px solid rgba(0,0,0,0.05);
          display: flex; align-items: center; justify-content: space-between;
        }
        .bs-card-price { font-size: 12px; font-weight: 600; color: #6b7280; }
        .bs-view-cta {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 700; color: #15803d; text-decoration: none;
        }

        /* ── ROW ── */
        .bs-row {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px; padding: 14px 16px;
          display: flex; align-items: flex-start; gap: 14px;
          text-decoration: none; transition: box-shadow .18s;
        }
        .bs-row:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .bs-row-thumb {
          width: 72px; height: 72px; border-radius: 12px;
          background: #f3f4f6; overflow: hidden; flex-shrink: 0;
        }
        .bs-row-img { width: 100%; height: 100%; object-fit: cover; }
        .bs-row-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #d1d5db; }
        .bs-row-body { flex: 1; min-width: 0; }
        .bs-row-title { font-size: 14px; font-weight: 700; color: #111; margin: 0 0 3px; }
        .bs-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }

        /* ── VENDOR CARD ── */
        .bs-vendor-card { gap: 0; }
        .bs-vc-head { display: flex; align-items: flex-start; gap: 12px; padding: 16px 16px 0; }
        .bs-vendor-card .bs-card-desc { padding: 8px 16px 0; }
        .bs-vendor-card .bs-card-tags { padding: 0 16px; margin-top: 10px; }
        .bs-vc-logo {
          width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff; font-size: 14px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .bs-vc-name { font-size: 14px; font-weight: 700; color: #111; margin: 0 0 2px; }
        .bs-vc-cat { font-size: 11px; color: #9ca3af; margin: 0; }
        .bs-vc-tier {
          font-size: 9.5px; font-weight: 800; letter-spacing: .06em;
          padding: 3px 9px; border-radius: 50px; white-space: nowrap; flex-shrink: 0;
        }
        .bs-vc-score { padding: 10px 16px 0; }
        .bs-vc-score-row { display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; margin-bottom: 5px; }
        .bs-vc-track { height: 5px; background: #f3f4f6; border-radius: 50px; overflow: hidden; }
        .bs-vc-fill { height: 100%; background: linear-gradient(90deg, #1db954, #16a34a); border-radius: 50px; transition: width .6s ease; }
        .bs-vc-foot {
          display: flex; align-items: center; justify-content: space-between;
          margin: 12px 16px 14px;
          border-top: 1px solid rgba(0,0,0,0.06); padding-top: 10px;
        }
        .bs-vc-loc { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9ca3af; font-weight: 500; }

        /* ── SKELETON ── */
        .bs-skel {
          height: 270px; border-radius: 18px;
          background: linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%);
          background-size: 400% 100%; animation: skel 1.4s infinite;
        }
        @keyframes skel { 0% { background-position: 100% 50%; } 100% { background-position: -100% 50%; } }

        /* ── EMPTY ── */
        .bs-empty {
          text-align: center; padding: 80px 24px; color: #9ca3af;
          background: #fff; border-radius: 20px; border: 1px dashed rgba(0,0,0,0.1);
        }
        .bs-empty-ico { font-size: 44px; margin-bottom: 14px; opacity: .35; }
        .bs-empty h3 { font-size: 18px; font-weight: 700; color: #374151; margin: 0 0 6px; }
        .bs-empty p { font-size: 14px; margin: 0; }

        /* ── MOBILE DRAWER ── */
        .bs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; animation: bsFadeIn .15s ease; }
        .bs-drawer {
          position: fixed; top: 0; left: 0; bottom: 0; width: 290px;
          background: #fff; z-index: 101; overflow-y: auto;
          padding: 20px; animation: bsSlide .2s ease;
        }
        @keyframes bsSlide { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes bsFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .bs-drawer-close { display: flex; justify-content: flex-end; margin-bottom: 10px; }
        .bs-drawer-close-btn {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: #f3f4f6; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151;
        }

        @media (max-width: 640px) {
          .bs-wrap { padding: 18px 14px 56px; display: block; }
          .bs-hero { padding: 28px 16px 24px; }
          .bs-hero-h { font-size: 28px; overflow-wrap: anywhere; }
          .bs-hero-sub { font-size: 13px; line-height: 1.45; }
          .bs-search-wrap { width: 100%; padding: 11px 14px; border-radius: 14px; }
          .bs-tabs { gap: 6px; }
          .bs-tab { padding: 8px 12px; font-size: 12px; }
          .bs-toolbar { align-items: flex-start; }
          .bs-toolbar-right { width: 100%; justify-content: space-between; }
          .bs-grid { grid-template-columns: 1fr; gap: 12px; }
          .bs-vendor-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="bs-page">
        <Header />

        {/* ── HERO ── */}
        <div className="bs-hero">
          <div className="bs-hero-inner">
            <Link href="/" className="bs-back"><FiArrowLeft size={13} />Back to Home</Link>
            <h1 className="bs-hero-h">Browse Marketplace</h1>
            <p className="bs-hero-sub">Discover ESG-verified vendors, products &amp; services across India</p>

            <div className="bs-search-wrap">
              <FiSearch size={17} className="bs-search-icon" />
              <input
                type="text" className="bs-search-in" autoComplete="off"
                placeholder={type === "Vendor" ? "Search vendors by name, category, location…" : type === "Service" ? "Search services…" : "Search products by name, tag, certification…"}
                value={localSearch} onChange={e => handleSearch(e.target.value)}
              />
              {localSearch && (
                <button className="bs-search-clear" onClick={() => handleSearch("")}><FiX size={12} /></button>
              )}
            </div>

            <div className="bs-tabs">
              {[{ val: "Product", label: "Products", Icon: FiPackage }, { val: "Vendor", label: "Vendors", Icon: FiUsers }, { val: "Service", label: "Services", Icon: FiTool }].map(({ val, label, Icon }) => (
                <button key={val} className={`bs-tab${type === val ? " bs-tab-active" : ""}`} onClick={() => updateUrl("type", val)}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="bs-wrap">
          <Sidebar />

          <main className="bs-main">
            {/* Toolbar */}
            <div className="bs-toolbar">
              <p className="bs-count">
                {loading ? "Loading…" : <><strong>{totalCount}</strong> {type === "Vendor" ? "vendors" : type === "Service" ? "services" : "products"} found{search && <> for &ldquo;<strong>{search}</strong>&rdquo;</>}</>}
              </p>
              <div className="bs-toolbar-right">
                <button className="bs-mobile-filter" onClick={() => setSidebarOpen(true)}>
                  <FiSliders size={13} />Filters{activeCount > 0 && <span className="bs-badge">{activeCount}</span>}
                </button>
                <div className="bs-view-toggle">
                  <button className={`bs-view-btn${viewMode === "grid" ? " bs-view-btn-active" : ""}`} onClick={() => setViewMode("grid")} title="Grid"><FiGrid size={14} /></button>
                  <button className={`bs-view-btn${viewMode === "list" ? " bs-view-btn-active" : ""}`} onClick={() => setViewMode("list")} title="List"><FiList size={14} /></button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {(filters.badge || filters.location) && (
              <div className="bs-active-chips">
                {filters.badge && (
                  <button className="bs-chip" onClick={() => setFilters(f => ({ ...f, badge: "" }))}>
                    {BADGES.find((item) => item.val === filters.badge)?.label || filters.badge} <FiX size={10} />
                  </button>
                )}
                {filters.location && <button className="bs-chip" onClick={() => setFilters(f => ({ ...f, location: "" }))}>{filters.location} <FiX size={10} /></button>}
              </div>
            )}

            {/* Skeleton */}
            {loading && (
              <div className={type === "Vendor" ? "bs-vendor-grid" : "bs-grid"}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bs-skel" />)}
              </div>
            )}

            {/* Empty */}
            {isEmpty && (
              <div className="bs-empty">
                <div className="bs-empty-ico">{type === "Vendor" ? <FiUsers /> : <FiPackage />}</div>
                <h3>No {type.toLowerCase()}s found</h3>
                <p>Try adjusting your search or filters to find what you&apos;re looking for.</p>
              </div>
            )}

            {/* Results */}
            {!loading && !isEmpty && (
              type === "Vendor" ? (
                <div className={viewMode === "grid" ? "bs-vendor-grid" : "bs-list-mode"}>
                  {vendors.map(v => <VendorCard key={v.id} v={v} />)}
                </div>
              ) : (
                <div className={viewMode === "grid" ? "bs-grid" : "bs-list-mode"}>
                  {products.map(p => <ProductCard key={p.id} p={p} />)}
                </div>
              )
            )}
          </main>
        </div>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <>
            <div className="bs-overlay" onClick={() => setSidebarOpen(false)} />
            <div className="bs-drawer">
              <div className="bs-drawer-close">
                <button className="bs-drawer-close-btn" onClick={() => setSidebarOpen(false)}><FiX size={15} /></button>
              </div>
              <Sidebar />
            </div>
          </>
        )}

        <Footer />
      </div>
    </>
  );
}
