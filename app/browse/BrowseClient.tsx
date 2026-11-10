"use client";

import { useEffect, useMemo, useState, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import BuyerRFQModal from "../components/ContactVendorModal";
import {
  fetchVendorStates,
  type PublicProduct,
  type PublicVendor,
} from "@/lib/supabasePublic";
import { getVendorBadgeMeta } from "@/lib/vendorBadges";
import { productHref, vendorHref } from "@/lib/slug";
import { vendorWebsite } from "@/lib/vendorWebsite";
import {
  FiSearch, FiX, FiArrowLeft, FiGrid, FiList, FiPackage, FiAward,
  FiTool, FiUsers, FiMapPin, FiFilter, FiChevronDown,
  FiChevronUp, FiRefreshCw, FiExternalLink, FiSliders,
  FiHeart, FiCheckCircle, FiGlobe, FiMessageSquare, FiBookmark,
  FiAlertTriangle, FiUser, FiLock, FiArrowUpRight // <-- Added these 4
} from "react-icons/fi";
import { HiOutlineSparkles, HiOutlineShieldCheck } from "react-icons/hi2";
import { getValidSession } from "@/lib/supabaseAuth";

/* ---------------- TYPES ---------------- */
type Product = PublicProduct & {
  categoryId?: string;
  ecoScore?: number;
  certifications?: string[];
  tags?: string[];
};
type Vendor = PublicVendor & { 
  GreenLensScore?: number;
  productCount?: number; 
  yearOfIncorporation?: string;
  city?: string;
  country?: string;
  profileCompleteness?: number;
};
type Category = { id: string; name: string; slug?: string; imageUrl?: string };
interface FilterState { badge: string; location: string; sortBy: string; }
const DEFAULT_SORT = "newest";

const BADGES = [
  { val: "", label: "All Badges", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  { val: "verified", label: "Verified", color: "#15803d", bg: "rgba(22,163,74,0.12)" },
  { val: "eco_verified", label: "Eco Verified", color: "#047857", bg: "rgba(4,120,87,0.1)" },
  { val: "unclaimed", label: "Unclaimed", color: "#b45309", bg: "rgba(254,243,199,1)" },
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
  if (v.claimStatus === 'UNCLAIMED' || v.isUnclaimed) return "unclaimed";
  if (v.ecoVerified) return "eco_verified";
  return "verified";
}

function vendorBadgeLabel(v: Vendor) {
  const badge = BADGES.find((item) => item.val === vendorBadge(v));
  return badge?.label || "Verified";
}
/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function BrowsePage({
  initialProducts = [],
  initialVendors = [],
  initialCategories = [],
  totalCount = 0,
  page = 1,
  pageSize = 12,
  vendorSummaries = [],
}: {
  initialProducts?: Product[];
  initialVendors?: Vendor[];
  initialCategories?: Category[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  vendorSummaries?: Array<{ id: string; slug?: string; companyName: string; state?: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const typeParam = params.get("type") || "Product";
  const type = typeParam.toLowerCase() === "vendor" ? "Vendor" : typeParam.toLowerCase() === "service" ? "Service" : "Product";
  const category = params.get("category") || "";
  const search = params.get("q") || "";

  // The server sends just the rows for this page; every filter, the sort and
  // the page number live in the URL so the database can do the work.
  const products = initialProducts;
  const vendors = initialVendors;
  const categories = initialCategories;
  const filters: FilterState = {
    badge: params.get("badge") || "",
    location: params.get("loc") || "",
    sortBy: params.get("sort") || DEFAULT_SORT,
  };
  const categoryId =
    categories.find(
      (item) =>
        item.id === category ||
        item.slug?.toLowerCase() === category.toLowerCase(),
    )?.id || category;
  const [loading, startNavigation] = useTransition();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const claimFilter = params.get("claim_status") || "ALL";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const [localLocation, setLocalLocation] = useState(filters.location);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  // Page lives in the URL (?page=N) rather than component state so each page
  // of results is a real, linkable URL Googlebot can reach and crawl.
  const currentPage = page;
  const [expanded, setExpanded] = useState({ type: true, category: true, eco: true, location: false, sort: true });
  const [rfqProduct, setRfqProduct] = useState<Product | null>(null);
  // NEW: State for the Claim Login modal
  const [claimLoginVendor, setClaimLoginVendor] = useState<Vendor | null>(null);

  // NEW: Handler for the claim button
  async function handleClaimClick(e: React.MouseEvent, v: Vendor) {
    e.preventDefault();
    e.stopPropagation();
    const session = await getValidSession().catch(() => null);
    
    if (!session?.accessToken) {
      // Not logged in -> Show Modal
      setClaimLoginVendor(v);
    } else {
      // Logged in -> Go straight to the claim form on the profile page
      router.push(vendorHref(v.id, v.slug) + "?claim=true");
    }
  }

  const vendorById = useMemo(
    () => new Map(vendorSummaries.map((vendor) => [vendor.id, vendor])),
    [vendorSummaries],
  );

  // Location suggestions load only once someone opens the Location filter.
  const [vendorLocations, setVendorLocations] = useState<string[]>([]);
  useEffect(() => {
    if (type !== "Vendor" || !expanded.location || vendorLocations.length) return;
    fetchVendorStates().then(setVendorLocations).catch(() => {});
  }, [type, expanded.location, vendorLocations.length]);

  // Sync the boxes from the URL (back button, cleared chip) — but not while
  // a typed value is still waiting to be applied, or keystrokes get lost.
  useEffect(() => { if (!debounce.current) setLocalSearch(search); }, [search]);
  useEffect(() => { if (!locationDebounce.current) setLocalLocation(filters.location); }, [filters.location]);

  function handleSearch(val: string) {
    setLocalSearch(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { debounce.current = null; updateUrl("q", val, {}, true); }, 350);
  }

  function handleLocation(val: string) {
    setLocalLocation(val);
    if (locationDebounce.current) clearTimeout(locationDebounce.current);
    locationDebounce.current = setTimeout(() => { locationDebounce.current = null; updateUrl("loc", val, {}, true); }, 350);
  }

  // Any change other than the page number starts again from page 1. Typing
  // replaces the history entry, so Back doesn't step through every letter.
  function updateUrl(key: string, value: string, extra: Record<string, string> = {}, replace = false) {
    const url = new URLSearchParams(params.toString());
    for (const [name, next] of Object.entries({ [key]: value, ...extra })) {
      if (next) url.set(name, next);
      else url.delete(name);
    }
    if (key !== "page") url.delete("page");
    const href = `/browse?${url.toString()}`;
    startNavigation(() => (replace ? router.replace(href, { scroll: false }) : router.push(href)));
  }

  function setFilter(key: "badge" | "sort", value: string) {
    updateUrl(key, key === "sort" && value === DEFAULT_SORT ? "" : value);
  }

  function pageHref(page: number) {
    const url = new URLSearchParams(params.toString());
    if (page > 1) url.set("page", String(page));
    else url.delete("page");
    const query = url.toString();
    return `/browse${query ? `?${query}` : ""}`;
  }

  function resetAll() { startNavigation(() => router.push(`/browse?type=${type}`)); }

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
              <button
                key={val}
                className={`bs-opt${type === val ? " bs-opt-active" : ""}`}
                onClick={() => updateUrl("type", val, { badge: "", loc: "" })}
              >
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
                <button key={c.id} className={`bs-opt${categoryId === c.id ? " bs-opt-active" : ""}`} onClick={() => updateUrl("category", c.slug || c.id)}>{c.name}</button>
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
            {(type === "Vendor"
              ? BADGES.filter(({ val }) => val !== "eco_verified")
              : BADGES.filter(({ val }) => val === "" || val === "eco_verified")
            ).map(({ val, label }) => (
              <button key={val} className={`bs-opt${filters.badge === val ? " bs-opt-active" : ""}`} onClick={() => setFilter("badge", val)}>{label}</button>
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
              <input
                type="search"
                list="vendor-location-options"
                placeholder="City, state or country…"
                value={localLocation}
                onChange={e => handleLocation(e.target.value)}
                className="bs-text-input"
              />
              <datalist id="vendor-location-options">
                {vendorLocations.map(location => <option key={location} value={location} />)}
              </datalist>
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
              <button key={val} className={`bs-opt${filters.sortBy === val ? " bs-opt-active" : ""}`} onClick={() => setFilter("sort", val)}>{label}</button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  /* ---- Product Card ---- */
  const ProductCard = ({ p }: { p: Product }) => {
    const localCat = categories.find((c) => c.id === p.categoryId);
    const categoryName = localCat?.name || "Uncategorized";

    const localVendor = vendorById.get(p.vendorId);
    const vendorName = localVendor?.companyName || p.vendorName || "Sustainly Vendor";
    const vendorState = localVendor?.state || "";

    return viewMode === "grid" ? (
      <div className="bs-card" style={{ display: "flex", flexDirection: "column", height: "100%", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", position: "relative" }}>
        
        {/* 1. Image & Top Overlays */}
        <Link 
          href={productHref(p.id, p.title)} 
          className="bs-card-img" 
          style={{ 
            position: "relative", 
            height: "180px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            background: "#ffffff", 
            flexShrink: 0,
            padding: "10px" 
          }}
        >
          {p.images?.[0] ? (
            <img 
              src={p.images[0]} 
              alt={p.title || ""} 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain", 
                objectPosition: "center" 
              }} 
            />
          ) : (
            <div style={{ background: "#f3f4f6", height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiPackage size={24} color="#9ca3af" />
            </div>
          )}
          
          {p.listingType && (
            <span style={{ position: "absolute", top: 8, left: 8, background: "#064e3b", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
              {Array.isArray(p.listingType) ? p.listingType[0] : p.listingType}
            </span>
          )}
          
          <button style={{ position: "absolute", top: 8, right: 8, background: "#fff", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} onClick={(e) => { e.preventDefault(); }}>
            <FiHeart size={12} color="#374151" />
          </button>

          {(p.images?.length || 0) > 1 && (
            <span style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" }}>
              {p.images!.length} Photos
            </span>
          )}
        </Link>

        {/* 2. Core Details & Impact */}
        <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", margin: 0, textTransform: "uppercase" }}>
            {Array.isArray(p.listingType) ? p.listingType.join(", ") : p.listingType || "PRODUCT"}
          </p>
          <Link href={productHref(p.id, p.title)} style={{ textDecoration: "none" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.2 }}>{p.title}</h3>
          </Link>
          
          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
            <FiGrid size={10} style={{ marginRight: 4, display: "inline-block", verticalAlign: "middle" }}/> 
            <span style={{ verticalAlign: "middle" }}>{categoryName}</span>
          </p>
          
          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
            <FiUsers size={10} style={{ marginRight: 4, display: "inline-block", verticalAlign: "middle" }}/> 
            <span style={{ verticalAlign: "middle" }}>{vendorName}</span>
          </p>

          {/* Sustainability & Trust Markers */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
            {(p.tags?.[0] || (p as any).tagNames?.[0] || p.ecoVerified) && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", color: "#15803d", padding: "0", fontSize: "11px", fontWeight: 600, width: "fit-content" }}>
                <HiOutlineSparkles size={11} /> {p.tags?.[0] || (p as any).tagNames?.[0] || "Reclaimed-material options"}
              </span>
            )}
            
            {(p.approved || p.ecoVerified) && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#111" }}>
                <FiCheckCircle color="#15803d" size={12} /> Verified supplier
              </span>
            )}
            
            {vendorState && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b7280" }}>
                <FiMapPin size={11} /> {vendorState}
              </span>
            )}
          </div>
          {/* Certifications */}
          {(p.certifications || []).length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {p.certifications!.slice(0, 2).map((c, idx) => (
                  <span key={c} style={{ background: idx === 0 ? "#94a3b8" : "#475569", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px" }}>{c}</span>
                ))}
              </div>
              <span style={{ fontSize: "10px", color: "#9ca3af" }}>Documents available</span>
            </div>
          )}
        </div>

        {/* 3. Pricing & Actions */}
        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#111" }}>
            {typeof p.price === "number" && p.price > 0 ? `${p.currency || '₹'} ${p.price}` : p.priceType || "Price on request"}
          </div>
          
          <button style={{ width: "100%", background: "#ff9932", color: "#000", border: "none", padding: "8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#a55505"} onMouseOut={e => e.currentTarget.style.background = "#ff9932"} onClick={(e) => { e.preventDefault(); setRfqProduct(p); }}>
            Request Quote
          </button>
          
          <Link href={productHref(p.id, p.title)} style={{ display: "block", textAlign: "center", width: "100%", boxSizing: "border-box", background: "#064e3b", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", textDecoration: "none", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#022c22"} onMouseOut={e => e.currentTarget.style.background = "#064e3b"}>
            View Details
          </Link>
        </div>
      </div>
    ) : (
      /* ---- List Mode ---- */
      <Link href={productHref(p.id, p.title)} className="bs-row" style={{ display: "flex", gap: "14px", textDecoration: "none", background: "#fff", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.07)", position: "relative" }}>
        <div className="bs-row-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: "4px", width: "110px", height: "110px", flexShrink: 0, border: "1px solid #f3f4f6", borderRadius: "12px" }}>
          {p.images?.[0] ? (
            <img 
              src={p.images[0]} 
              alt={p.title} 
              className="bs-row-img" 
              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }} 
            />
          ) : (
            <div className="bs-row-ph"><FiPackage size={18} color="#9ca3af" /></div>
          )}
        </div>
        <div className="bs-row-body" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 className="bs-row-title" style={{ fontSize: "15px", fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{p.title}</h3>
          
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 2px" }}>
            <FiGrid size={10} style={{ marginRight: 4, display: "inline-block", verticalAlign: "middle" }}/> 
            <span style={{ verticalAlign: "middle" }}>{categoryName}</span>
          </p>

          <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 2px" }}>
            <FiUsers size={10} style={{ marginRight: 4, display: "inline-block", verticalAlign: "middle" }}/> 
            <span style={{ verticalAlign: "middle" }}>{vendorName}</span>
          </p>

          {vendorState && (
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 6px" }}>
              <FiMapPin size={10} style={{ marginRight: 4, display: "inline-block", verticalAlign: "middle" }}/> 
              <span style={{ verticalAlign: "middle" }}>{vendorState}</span>
            </p>
          )}

          {p.description && (
            <p className="bs-card-desc" style={{ fontSize: "12px", color: "#15803d", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", background: "transparent" }}>
              {p.description.replace(/<[^>]+>/g, "")}
            </p>
          )}
          
          {(p.certifications || []).length > 0 && (
            <div className="bs-card-tags" style={{ marginTop: 8, display: "flex", gap: "4px" }}>
              {p.certifications!.slice(0, 3).map(c => <span key={c} style={{ background: "#475569", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px" }}>{c}</span>)}
            </div>
          )}
        </div>
        <div className="bs-row-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0, width: "140px" }} onClick={(e) => e.stopPropagation()}>
          {p.ecoVerified && (
            <span className="bs-card-eco" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", color: "#15803d", padding: 0, fontSize: "11px", fontWeight: 600 }}>
              <HiOutlineSparkles size={11} /> Eco Verified
            </span>
          )}
          <span className="bs-card-price" style={{ fontSize: "14px", fontWeight: 800, color: "#111", margin: "4px 0" }}>
            {typeof p.price === "number" && p.price > 0 ? `${p.currency || '₹'} ${p.price}` : p.priceType || "On request"}
          </span>

          <button style={{ width: "100%", background: "#ff9932", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#022c22"} onMouseOut={e => e.currentTarget.style.background = "#ff9932"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRfqProduct(p); }}>
            Request Quote
          </button>
          
          <Link href={productHref(p.id, p.title)} style={{ width: "100%", display: "block", textAlign: "center", boxSizing: "border-box", background: "#064e3b", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "none", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#022c22"} onMouseOut={e => e.currentTarget.style.background = "#064e3b"}>
            View Details
          </Link>
        </div>
      </Link>
    );
  };

/* ---- Vendor Card ---- */
  const logoInitials = (v: Vendor) => (typeof v.logoText === "string" && v.logoText.trim() ? v.logoText : (vt(v.companyName, "V").slice(0, 2) || "V")).toUpperCase();

  const VendorCard = ({ v }: { v: Vendor }) => {
    const isUnclaimed = v.claimStatus === 'UNCLAIMED' || v.isUnclaimed;
    
    // Calculate Years in Business
    const currentYear = new Date().getFullYear();
    const yib = v.yearOfIncorporation ? currentYear - parseInt(v.yearOfIncorporation) : null;

    // Formatting Location
    const locationParts = [v.city, v.state, v.country].filter(Boolean);
    const locationString = locationParts.length > 0 ? locationParts.join(", ") : v.location || "Location not specified";

    
    if (viewMode !== "grid") {
      return (
        /* --- LIST MODE --- */
        <div 
          className="bs-row"
          style={{
            borderColor: isUnclaimed ? "#fcd34d" : "#e5e7eb",
            background: "#fff",
            padding: 0,
            overflow: "hidden",
            display: "flex",
            borderRadius: "14px"
          }}
        >
          {/* Vertical left color bar indicating status */}
          <div style={{ width: "6px", background: isUnclaimed ? "#fcd34d" : "#10b981", flexShrink: 0 }} />
          
          <div style={{ display: "flex", gap: "16px", padding: "16px", width: "100%", alignItems: "center" }}>
            <div className="bs-vc-logo" style={{ 
              width: 72, height: 72, fontSize: 20, flexShrink: 0, borderRadius: 12, 
              background: isUnclaimed ? "#fffbeb" : "#15803d",
              color: isUnclaimed ? "#b45309" : "#fff",
              border: isUnclaimed ? "1px solid #fcd34d" : "none",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {v.logoUrl ? <img src={v.logoUrl} alt={vt(v.companyName)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} /> : logoInitials(v)}
            </div>
            
            <div className="bs-row-body" style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
             <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h3 className="bs-row-title" style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>{vt(v.companyName, "Unnamed Vendor")}</h3>
                {isUnclaimed ? (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "3px 10px", borderRadius: "50px", border: "1px solid #fcd34d", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FiAlertTriangle size={12} /> UNCLAIMED
                  </span>
                ) : (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "3px 10px", borderRadius: "50px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FiCheckCircle size={12} /> VERIFIED BUSINESS
                  </span>
                )}
                
                {!isUnclaimed && v.category && (
                  <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px" }}>
                    {vt(v.category)}
                  </span>
                )}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                {isUnclaimed && v.category && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FiGrid size={13} /> {vt(v.category)}</span>}
                {locationString && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FiMapPin size={13} /> {locationString}</span>}
                
                {!isUnclaimed && v.approved && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#15803d", fontWeight: 700 }}>
                    <HiOutlineShieldCheck size={16} /> GST & Address Verified
                  </span>
                )}
              </div>
              
              {v.description && (
                <p className="bs-card-desc" style={{ margin: 0, color: "#4b5563", fontSize: "13px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.55 }}>
                  {vt(v.description).replace(/<[^>]+>/g, "")}
                </p>
              )}
            </div>
            
            {/* Stats Block (List View) */}
            <div style={{ display: "flex", gap: "24px", padding: "0 24px", borderLeft: "1px solid #f3f4f6", borderRight: "1px solid #f3f4f6", textAlign: "center" }}>
              {isUnclaimed ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>--</span>
                    <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 600 }}>(Claim to edit)</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>--</span>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Verification locked</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>{v.productCount ? `${v.productCount}+` : '0'}</span>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Active Products</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>{(v.certifications || []).length}</span>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Certifications</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>{yib ? `${yib}` : '-'}</span>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Yrs in Business</span>
                  </div>
                </>
              )}
            </div>

            <div className="bs-row-right" style={{ justifyContent: "center", width: "160px", gap: "8px" }}>
              {isUnclaimed ? (
                <button 
                  onClick={(e) => { e.preventDefault(); handleClaimClick(e, v); }} 
                  style={{ width: "100%", background: "transparent", color: "#b45309", border: "1px solid #d97706", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#fffbeb"} 
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Claim <FiArrowUpRight size={14} />
                </button>
              ) : (
                <button style={{ width: "100%", background: "#14532d", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#064e3b"} onMouseOut={e => e.currentTarget.style.background = "#14532d"} onClick={(e) => { e.preventDefault(); }}>
                  <FiMessageSquare size={13} /> Send Inquiry
                </button>
              )}
              <Link href={vendorHref(v.id, v.slug)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#374151", border: "1px solid #d1d5db", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, textDecoration: "none", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f9fafb"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                View Profile
              </Link>
            </div>
          </div>
        </div>
      );
    }


    // --- GRID MODE: UNCLAIMED CARD ---
    if (isUnclaimed) {
      return (
        <div className="bs-vendor-card" style={{ background: "#f4f5f6", borderColor: "#e5e7eb", display: "flex", flexDirection: "column" }}>
          {/* Top Bar */}
          <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em" }}>
            <FiAlertTriangle size={14} /> UNCLAIMED LISTING
          </div>

          <div className="bs-vc-main" style={{ paddingTop: "12px", display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Logo and Name */}
            <div className="bs-vc-header-row" style={{ alignItems: 'center', gap: "14px", marginBottom: "16px" }}>
              <div className="bs-vc-logo-box" style={{ background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "14px", width: "54px", height: "54px", fontSize: "18px", fontWeight: 800 }}>
                {v.logoUrl ? <img src={v.logoUrl} alt={vt(v.companyName)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} /> : logoInitials(v)}
              </div>
              <div className="bs-vc-info">
                <h3 style={{ fontSize: '18px', color: '#111', fontWeight: 800, margin: "0 0 4px" }}>{vt(v.companyName, "Unnamed Vendor")}</h3>
                <div className="bs-vc-location" style={{ fontSize: "13px", color: "#4b5563", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FiMapPin size={13} /> {locationString}
                </div>
              </div>
            </div>

            {/* Description */}
            {v.description && (
              <p className="bs-vc-desc" style={{ fontSize: "13px", color: "#374151", marginBottom: "14px", lineHeight: 1.5 }}>
                {vt(v.description).replace(/<[^>]+>/g, "").slice(0, 100)}…
              </p>
            )}

            {/* Categories / Tags */}
            {(v.subCategories || []).length > 0 && (
              <div className="bs-vc-tags-row" style={{ marginBottom: "16px", gap: "8px" }}>
                {v.subCategories!.slice(0, 3).map((item, i) => (
                  <span key={`sub-${i}`} style={{ background: "#e5e7eb", color: "#4b5563", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>{vt(item)}</span>
                ))}
              </div>
            )}

            <div style={{ flex: 1 }}></div> {/* Pushes bottom content down */}

            {/* Locked Stats Section */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "14px", paddingBottom: "14px", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", fontWeight: 700, color: "#111" }}>
              <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                <span>Products: --</span>
                <span style={{ color: "#b45309", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>(Claim to edit) <FiLock size={12} color="#9ca3af" /></span>
              </div>
              <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                <span>Certifications: --</span>
                <span style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500 }}>Verification locked <FiLock size={12} color="#9ca3af" /></span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={(e) => handleClaimClick(e, v)} style={{ background: "transparent", border: "1px solid #d97706", color: "#b45309", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#fffbeb"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                Claim this business <FiArrowUpRight size={16} />
              </button>
              <Link href={vendorHref(v.id, v.slug)} style={{ background: "transparent", color: "#374151", border: "none", padding: "10px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", cursor: "pointer", borderRadius: "8px", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#e5e7eb"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                View Profile
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // --- GRID MODE: VERIFIED CARD REDESIGN ---
    return (
      <div className="bs-vendor-card" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Top Bar with separate pills */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 0" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#dcfce7", color: "#166534", fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "50px", textTransform: "uppercase" }}>
            <FiCheckCircle size={12} /> VERIFIED BUSINESS
          </span>
          {v.category && (
            <span style={{ display: "inline-flex", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px" }}>
              {vt(v.category)}
            </span>
          )}
        </div>

        <div className="bs-vc-main" style={{ display: "flex", flexDirection: "column", flex: 1, padding: "16px 0 0" }}>
          
          {/* Header Row: Logo & Name */}
          <div style={{ display: "flex", gap: "14px", padding: "0 16px 16px", alignItems: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "10px", background: "#15803d", color: "#fff", fontSize: "18px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {v.logoUrl ? <img src={v.logoUrl} alt={vt(v.companyName)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} /> : logoInitials(v)}
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#111", margin: "0 0 4px", lineHeight: 1.2 }}>{vt(v.companyName, "Unnamed Vendor")}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6b7280" }}>
                <FiMapPin size={13} /> {locationString}
              </div>
            </div>
          </div>

          {/* Shield Trust Badge */}
          {v.approved && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#15803d", padding: "0 16px", marginBottom: "14px" }}>
              <HiOutlineShieldCheck size={18} /> GST & Address Verified
            </div>
          )}

          {/* Description */}
          {v.description && (
            <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.55, margin: "0 16px 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {vt(v.description).replace(/<[^>]+>/g, "").slice(0, 110)}…
            </p>
          )}
          
          <div style={{ flex: 1 }}></div> {/* Spacer */}

          {/* Stats Grid (3 Columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "16px 0", margin: "0 16px 16px", textAlign: "center" }}>
            <div style={{ borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>{v.productCount ? `${v.productCount}+` : '0'}</span>
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Active Products</span>
            </div>
            <div style={{ borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>{(v.certifications || []).length}</span>
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Certifications</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#111" }}>{yib ? `${yib}` : '-'}</span>
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Yrs in Business</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", padding: "0 16px 16px" }}>
            <button style={{ flex: 1, background: "#14532d", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#064e3b"} onMouseOut={e => e.currentTarget.style.background = "#14532d"} onClick={(e) => { e.preventDefault(); }}>
              <FiMessageSquare size={14} /> Send Inquiry
            </button>
            <Link href={vendorHref(v.id, v.slug)} style={{ flex: 1, background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f9fafb"} onMouseOut={e => e.currentTarget.style.background = "#fff"}>
              View Profile
            </Link>
          </div>

        </div>
      </div>
    );
  };  const items = type === "Vendor" ? vendors : products;
  const isEmpty = !loading && items.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
 const pageStart = (safePage - 1) * pageSize;
  const pageEnd = pageStart + items.length;
  const visibleVendors = vendors;
  const visibleProducts = products;
  
  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    const start = Math.max(1, Math.min(safePage - halfWindow, totalPages - windowSize + 1));
    const end = Math.min(totalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);

  function scrollToResults() {
    requestAnimationFrame(() => {
      resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Real <a href> links, not buttons: crawlers follow hrefs but never click.
  const PageLink = ({ page, label, active }: { page: number; label?: string; active?: boolean }) => (
    <Link
      href={pageHref(page)}
      scroll={false}
      onClick={scrollToResults}
      className={`bs-page-btn${active ? " bs-page-btn-active" : ""}`}
      aria-current={active ? "page" : undefined}
      rel={label === "Previous" ? "prev" : label === "Next" ? "next" : undefined}
    >
      {label || page}
    </Link>
  );

  /* ============================================================ RENDER */
  return (
    <>
<style>{`
        /* ── BASE ── */
        .bs-page { min-height: 100vh; background: #f6f7f5; max-width: 100%; overflow-x: hidden; }

        /* ── NEW HERO REDESIGN ── */
        .bs-hero {
          background: #fdf9f1;
          padding: 48px 24px;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid #e5e7eb;
        }
        /* Geometric Beige Background Shapes */
        .bs-hero-bg-shape1 {
          position: absolute; top: -50px; left: -100px;
          width: 500px; height: 500px;
          background: #f4ead5;
          border-radius: 50%; z-index: 0;
          opacity: 0.6; filter: blur(60px); pointer-events: none;
        }
        .bs-hero-bg-shape2 {
          position: absolute; bottom: -150px; right: 10%;
          width: 700px; height: 400px;
          background: #f9edd4;
          transform: rotate(-15deg); border-radius: 100px;
          z-index: 0; opacity: 0.7; pointer-events: none;
        }

        .bs-hero-inner {
          max-width: 1240px; margin: 0 auto;
          position: relative; z-index: 1;
          display: flex; flex-wrap: wrap; gap: 40px;
          align-items: center; justify-content: space-between;
        }
        .bs-hero-left {
          flex: 1 1 450px;
          max-width: 540px;
        }
        .bs-hero-right {
          display: flex; gap: 16px;
          flex-wrap: wrap; justify-content: flex-end;
          flex: 1 1 auto;
        }
        
        .bs-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #6b7280; font-size: 13px; font-weight: 600;
          text-decoration: none; margin-bottom: 16px;
          transition: color .2s;
        }
        .bs-back:hover { color: #111; }
        .bs-hero-h {
          font-size: clamp(28px, 3.5vw, 40px); font-weight: 800;
          color: #111827; margin: 0 0 8px;
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .bs-hero-sub {
          font-size: 15px; color: #4b5563; font-weight: 500;
          margin: 0 0 28px;
        }

        /* search */
        .bs-search-wrap {
          display: flex; align-items: center; gap: 12px;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 50px; padding: 12px 20px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          width: 100%;
          transition: border-color .2s, box-shadow .2s;
        }
        .bs-search-wrap:focus-within {
          border-color: #16a34a;
          box-shadow: 0 8px 24px rgba(22,163,74,0.08);
        }
        .bs-search-icon { color: #6b7280; flex-shrink: 0; }
        .bs-search-in {
          flex: 1; background: none; border: none; outline: none;
          color: #111; font-size: 15px; font-weight: 500; font-family: inherit;
          min-width: 0;
        }
        .bs-search-in::placeholder { color: #9ca3af; font-weight: 400; }
        .bs-search-clear {
          width: 26px; height: 26px; border-radius: 50%; border: none; cursor: pointer;
          background: #f3f4f6; color: #6b7280;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: background .15s;
        }
        .bs-search-clear:hover { background: #e5e7eb; color: #111; }

        /* type tabs */
        .bs-tabs { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
        .bs-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 700;
          border: 1.5px solid #d1d5db;
          background: #fff; color: #4b5563;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          cursor: pointer; transition: all .2s; text-decoration: none;
        }
        .bs-tab:hover { border-color: #9ca3af; background: #f9fafb; color: #111; }
        .bs-tab.bs-tab-active { background: #16a34a !important; border-color: #16a34a !important; color: #fff !important; }

        /* ── PROMO CARDS (Right Side Hero) ── */
        .promo-card {
          width: 175px; height: 240px;
          border-radius: 18px; padding: 22px 16px 16px;
          position: relative; display: flex; flex-direction: column;
          color: #fff; text-decoration: none;
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
          overflow: hidden; transition: transform .3s ease, box-shadow .3s ease;
        }
        .promo-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.12);
        }
        
        .promo-blue { background: linear-gradient(145deg, #15344b, #15344b); }
        .promo-green { background: linear-gradient(145deg, #0b5146, #0b5146); }
        .promo-orange { background: linear-gradient(145deg, #6b482d, #6b482d); }
        
        .promo-badge-wrap {
          position: absolute; top: -8px; right: -8px;
          background: #eab308; color: #422006;
          font-size: 9px; font-weight: 800; text-align: center;
          width: 46px; height: 46px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          line-height: 1.1; z-index: 2;
        }
        
        .promo-card h3 {
          font-size: 17px; font-weight: 800; margin: 0 0 6px;
          line-height: 1.2; position: relative; z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .promo-card p {
          font-size: 12px; font-weight: 500; opacity: 0.9; margin: 0;
          line-height: 1.4; position: relative; z-index: 2;
        }
        
        .promo-icon-bg {
          position: absolute; bottom: 75px; right: 10px;
          font-size: 58px; color: #ffffff; z-index: 1; transform: rotate(-10deg);
          filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.2)); 
        }
        
        .promo-btn {
          margin-top: auto; position: relative; z-index: 2;
          background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.4);
          border-radius: 50px; padding: 8px 12px; font-size: 12px; font-weight: 700;
          color: #fff; text-align: center; backdrop-filter: blur(4px);
          transition: background .2s;
        }
        .promo-card:hover .promo-btn { background: rgba(255,255,255,0.35); }

        /* ── CONTENT WRAP ── */
        .bs-wrap {
          max-width: 1200px; margin: 0 auto;
          padding: 28px 24px 72px;
          display: flex; gap: 24px; align-items: flex-start;
          min-width: 0; width: 100%;
        }

        /* ── SIDEBAR ── */
        .bs-sidebar {
          width: 228px; flex-shrink: 0; background: #fff;
          border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 18px;
          position: sticky; top: 84px; max-height: calc(100vh - 104px);
          overflow-y: auto; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        @media (max-width:900px) {
          .bs-wrap > .bs-sidebar { display: none; }
          .bs-drawer .bs-sidebar {
            display: block; width: 100%; position: static; max-height: none;
            overflow: visible; border: none; box-shadow: none; padding: 0;
          }
        }
        .bs-sb-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.07);
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
        .bs-opt:hover { background: rgba(22,163,74,0.07); color: #15344b; }
        .bs-opt-active { background: rgba(22,163,74,0.1) !important; color: #15344b !important; font-weight: 700 !important; }
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
          display: flex; gap: 3px; background: rgba(0,0,0,0.06); border-radius: 10px; padding: 3px;
        }
        .bs-view-btn {
          width: 32px; height: 32px; border-radius: 7px; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          background: none; color: #9ca3af; transition: all .15s;
        }
        .bs-view-btn-active { background: #fff !important; color: #16a34a !important; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
        .bs-results-anchor { scroll-margin-top: 96px; }

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
        .bs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
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
          position: relative; background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 14px;
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

        /* ── VERIFIED VENDOR CARD REDESIGN ── */
        .bs-vendor-card { 
          gap: 0; 
          position: relative; 
          border: 1px solid #bbf7d0; /* Light green border */
          border-radius: 12px;
          background: #ffffff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .bs-vc-topbar {
          background: #ecfdf5; /* Light green background */
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          border-bottom: 1px solid #d1fae5;
        }
        .bs-vc-topbar-left {
          font-size: 10px;
          font-weight: 700;
          color: #065f46;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .bs-vc-topbar-right {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #a7f3d0;
          color: #065f46;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 50px;
          text-transform: uppercase;
        }
        .bs-vc-main {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .bs-vc-header-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .bs-vc-logo-box {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          background: #f0fdf4;
          color: #15803d;
          font-size: 18px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #bbf7d0;
        }
        .bs-vc-info h3 {
          font-size: 16px;
          font-weight: 800;
          color: #111;
          margin: 0 0 4px;
          line-height: 1.2;
        }
        .bs-vc-pill-cat {
          display: inline-block;
          background: #ecfdf5;
          color: #065f46;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 4px;
        }
        .bs-vc-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #4b5563;
        }
        .bs-vc-trust {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #15803d;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .bs-vc-desc {
          font-size: 12px;
          color: #374151;
          line-height: 1.5;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bs-vc-tags-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .bs-vc-tag-pill {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 50px;
        }
        .bs-vc-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          text-align: center;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
          padding: 12px 0;
          margin-bottom: 12px;
        }
        .bs-vc-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          border-right: 1px solid #f3f4f6;
        }
        .bs-vc-stat-item:last-child {
          border-right: none;
        }
        .bs-vc-stat-val {
          font-size: 16px;
          font-weight: 800;
          color: #111;
        }
        .bs-vc-stat-label {
          font-size: 10px;
          color: #6b7280;
          font-weight: 500;
          margin-top: 2px;
        }
        .bs-vc-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }
        .bs-btn-primary {
          flex: 1;
          background: #14532d;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          text-decoration: none;
        }
        .bs-btn-secondary {
          flex: 1;
          background: #ff9932;
          color: #fff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
        }
        .bs-btn-icon {
          background: #fff;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          width: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* ── UNCLAIMED VENDOR CARD COLORS ── */
        .bs-vendor-card-unclaimed {
          border-color: #fcd34d; /* Amber border */
          background: #ffffff;
        }
        .bs-vc-topbar-unclaimed {
          background: #fffbeb; /* Light amber background */
          border-bottom: 1px solid #fcd34d;
        }
        .bs-vc-topbar-left-unclaimed {
          color: #b45309; /* Amber text */
        }
        .bs-vc-topbar-right-unclaimed {
          background: #fef3c7; /* Amber pill background */
          color: #b45309; /* Amber text */
          border: 1px solid #FFC7CE;
        }
        .bs-vc-logo-box-unclaimed {
          background: #fffbeb;
          color: #b45309;
          border-color: #FFC7CE;
        }
        .bs-vc-unclaimed-trust {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #b45309; /* Amber text */
          background: #ffffff;
          padding: 6px 12px;
          border-radius: 50px;
          font-weight: 600;
          margin-bottom: 12px;
          width: fit-content;
          border: 1px solid #fcd34d; /* Amber border */
        }
        .bs-vc-tag-pill-unclaimed {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #374151;
        }
        .bs-vc-locked-stats {
          font-size: 13px;
          color: #111;
          font-weight: 700;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .bs-vc-locked-stats span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bs-vc-locked-hint {
          color: #d97706; /* Amber text for (Claim to edit) */
          font-weight: 600;
        }
        
        /* ── BUTTON STYLES (Unclaimed) ── */
        .bs-btn-claim {
          background: #f59e0b; /* Bright amber/orange */
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 12px 10px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          text-decoration: none;
          width: 100%;
          margin-bottom: 8px;
          transition: background 0.2s, transform 0.15s;
        }
        .bs-btn-claim:hover { 
          background: #d97706; 
          transform: translateY(-1px);
        }
        .bs-btn-secondary-full {
          width: 100%;
          background: #fff;
          color: #374151; /* Default dark gray text */
          border: 1px solid #d1d5db; /* Default gray border */
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }
        .bs-btn-secondary-full:hover { background: #f9fafb; }

        /* ── CLAIM LOGIN MODAL (BROWSE PAGE) ── */
        .bs-modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(5,15,10,0.7); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .bs-login-modal {
          width: 100%; max-width: 440px; background: #fff; border-radius: 20px;
          padding: 26px; gap: 18px; position: relative;
          box-shadow: 0 32px 100px rgba(0,0,0,0.35); display: flex; flex-direction: column;
        }
        .bs-login-head { display: flex; gap: 14px; align-items: flex-start; }
        .bs-login-icon {
          width: 46px; height: 46px; border-radius: 14px; background: #f0fdf4;
          color: #15803d; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .bs-login-title { margin: 0 0 6px; color: #111; font-size: 20px; font-weight: 800; line-height: 1.2; }
        .bs-login-copy { margin: 0; color: #6b7280; font-size: 13.5px; line-height: 1.6; }
        .bs-login-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .bs-login-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          min-height: 42px; padding: 0 18px; border-radius: 50px; font-size: 13px; font-weight: 800;
          text-decoration: none; border: 1px solid rgba(0,0,0,0.1); cursor: pointer;
        }
        .bs-login-btn-primary { background: #16a34a; color: #fff; border-color: #16a34a; }
        .bs-login-btn-secondary { background: #fff; color: #374151; }
        .bs-login-close {
          position: absolute; top: 14px; right: 14px; width: 32px; height: 32px;
          border-radius: 50%; border: none; background: #f3f4f6; color: #6b7280;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .bs-login-close:hover { background: #e5e7eb; color: #111; }

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

        /* ── PAGINATION ── */
        .bs-pagination {
          margin-top: 22px; padding: 14px 16px; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px; background: #fff; display: flex; align-items: center;
          justify-content: space-between; gap: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .bs-page-meta { margin: 0; color: #6b7280; font-size: 13px; font-weight: 600; }
        .bs-page-meta strong { color: #111; }
        .bs-page-controls { display: flex; align-items: center; gap: 6px; }
        .bs-page-btn {
          min-width: 34px; height: 34px; padding: 0 11px; border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px; background: #fff; color: #374151; font-size: 12.5px;
          font-weight: 700; cursor: pointer; font-family: inherit;
          transition: background .15s, color .15s, border-color .15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          text-decoration: none;
        }
        .bs-page-btn:hover:not([aria-disabled="true"]):not(.bs-page-btn-active) {
          background: rgba(22,163,74,0.08); border-color: rgba(22,163,74,0.24); color: #15803d;
        }
        .bs-page-btn-active { background: #16a34a; border-color: #16a34a; color: #fff; }
        .bs-page-btn[aria-disabled="true"] { opacity: .42; cursor: not-allowed; }

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

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .bs-hero-inner { flex-direction: column; align-items: stretch; gap: 24px; }
          .bs-hero-right {
            flex-wrap: nowrap; overflow-x: auto; padding-bottom: 10px;
            justify-content: flex-start; scroll-snap-type: x mandatory;
            margin: 0 -24px; padding: 0 24px 16px;
          }
          .promo-card { scroll-snap-align: start; flex-shrink: 0; }
        }

        @media (max-width: 640px) {
          .bs-wrap { padding: 18px 14px 56px; display: block; }
          .bs-hero { padding: 28px 16px 16px; }
          .bs-hero-h { font-size: 28px; overflow-wrap: anywhere; }
          .bs-hero-sub { font-size: 13px; line-height: 1.45; }
          .bs-search-wrap { width: 100%; padding: 11px 14px; border-radius: 50px; }
          .bs-tabs { gap: 6px; }
          .bs-tab { padding: 8px 12px; font-size: 12px; }
          .bs-toolbar { align-items: flex-start; }
          .bs-toolbar-right { width: 100%; justify-content: space-between; }
          .bs-grid { grid-template-columns: 1fr; gap: 12px; }
          .bs-vendor-grid { grid-template-columns: 1fr; }
          .bs-pagination { align-items: stretch; flex-direction: column; }
          .bs-page-controls { justify-content: center; flex-wrap: wrap; }
          .bs-page-meta { text-align: center; }
          .bs-hero-right { margin: 0 -16px; padding: 0 16px 12px; }
        }
      `}</style>        

      <div className={`app-page-surface bs-page${type === "Vendor" ? " bs-page-vendor" : ""}`}>
        <Header />

        {/* ── REDESIGNED HERO ── */}
        <div className="bs-hero">
          <div className="bs-hero-bg-shape1"></div>
          <div className="bs-hero-bg-shape2"></div>
          
          <div className="bs-hero-inner">
            
            {/* Left Content */}
            <div className="bs-hero-left">
              <Link href="/" className="bs-back"><FiArrowLeft size={13} />Back to Home</Link>
              <h1 className="bs-hero-h">Browse Marketplace</h1>
              <p className="bs-hero-sub">Discover ESG-verified vendors, products &amp; services across India</p>

              <div className="bs-search-wrap">
                <FiSearch size={18} className="bs-search-icon" />
                <input
                  type="text" className="bs-search-in" autoComplete="off"
                  placeholder={type === "Vendor" ? "Search vendors by name, category, location…" : type === "Service" ? "Search services…" : "Search products, vendors, categories or certifications..."}
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

            {/* Right Promo Cards */}
            <div className="bs-hero-right">
              
              {/* Card 1: Blue */}
              <div className="promo-card promo-blue">
                 <div className="promo-badge-wrap">100%<br/>Certified</div>
                 <h3>Bulk Sourcing</h3>
                 <p>Get Quick Quotes</p>
                 <FiPackage className="promo-icon-bg" />
                 <div className="promo-btn">Get Quotes</div>
              </div>

              {/* Card 2: Green */}
              <div className="promo-card promo-green">
                 <div className="promo-badge-wrap">100%<br/>Certified</div>
                 <h3>VERIFIED Vendors</h3>
                 <p>Discover Sustainable Brands</p>
                 <FiUsers className="promo-icon-bg" />
                 <div className="promo-btn">Browse Vendors</div>
              </div>

              {/* Card 3: Orange */}
              <div className="promo-card promo-orange">
   <div className="promo-badge-wrap">100%<br/>Certified</div>
   <h3>ESG & Green Services</h3>
   <p>Best Rates & Estimates</p>
   
   {/* Replace <FiTool /> with <FiAward /> or <FaCertificate /> */}
   <FiAward className="promo-icon-bg" />
   
   <div className="promo-btn">Explore Services</div>
</div>

            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="bs-wrap">
          <Sidebar />

          <main className="bs-main app-page-surface">
            <div ref={resultsTopRef} className="bs-results-anchor" />

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
                  <button className="bs-chip" onClick={() => setFilter("badge", "")}>
                    {BADGES.find((item) => item.val === filters.badge)?.label || filters.badge} <FiX size={10} />
                  </button>
                )}
                {filters.location && <button className="bs-chip" onClick={() => updateUrl("loc", "")}>{filters.location} <FiX size={10} /></button>}
              </div>
            )}

            {/* --- MOVED CLAIM FILTER BAR HERE --- */}
            {type === "Vendor" && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['ALL', 'VERIFIED', 'UNCLAIMED'].map(status => {
                  // Map display values to API parameter values
                  const paramValue = status === 'VERIFIED' ? 'CLAIMED' : status === 'ALL' ? '' : status;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => updateUrl("claim_status", paramValue)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid ' + (
                          (status === 'ALL' && !claimFilter) || 
                          (status === 'VERIFIED' && claimFilter === 'CLAIMED') || 
                          (status === 'UNCLAIMED' && claimFilter === 'UNCLAIMED') 
                          ? '#16a34a' : '#d1d5db'
                        ),
                        background: (
                          (status === 'ALL' && !claimFilter) || 
                          (status === 'VERIFIED' && claimFilter === 'CLAIMED') || 
                          (status === 'UNCLAIMED' && claimFilter === 'UNCLAIMED') 
                          ? '#f0fdf4' : '#fff'
                        ),
                        color: (
                          (status === 'ALL' && !claimFilter) || 
                          (status === 'VERIFIED' && claimFilter === 'CLAIMED') || 
                          (status === 'UNCLAIMED' && claimFilter === 'UNCLAIMED') 
                          ? '#15803d' : '#4b5563'
                        ),
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {status === 'ALL' ? 'All Statuses' : status}
                    </button>
                  );
                })}
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
                  {visibleVendors.map(v => <VendorCard key={v.id} v={v} />)}
                </div>
              ) : (
                <div className={viewMode === "grid" ? "bs-grid" : "bs-list-mode"}>
                  {visibleProducts.map(p => <ProductCard key={p.id} p={p} />)}
                </div>
              )
            )}

            {/* Pagination */}
            {!loading && !isEmpty && totalPages > 1 && (
              <div className="bs-pagination" aria-label={`${type} pagination`}>
                <p className="bs-page-meta">
                  Showing <strong>{pageStart + 1}-{pageEnd}</strong> of <strong>{totalCount}</strong>
                </p>
                <div className="bs-page-controls">
                  {safePage === 1
                    ? <span className="bs-page-btn" aria-disabled="true">Previous</span>
                    : <PageLink page={safePage - 1} label="Previous" />}
                  {pageNumbers[0] > 1 && (
                    <>
                      <PageLink page={1} />
                      {pageNumbers[0] > 2 && <span className="bs-page-meta">…</span>}
                    </>
                  )}
                  {pageNumbers.map(page => (
                    <PageLink key={page} page={page} active={safePage === page} />
                  ))}
                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="bs-page-meta">…</span>}
                      <PageLink page={totalPages} />
                    </>
                  )}
                  {safePage === totalPages
                    ? <span className="bs-page-btn" aria-disabled="true">Next</span>
                    : <PageLink page={safePage + 1} label="Next" />}
                </div>
              </div>
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

        <BuyerRFQModal
          open={!!rfqProduct}
          onClose={() => setRfqProduct(null)}
          vendorId={rfqProduct?.vendorId || ""}
          productId={rfqProduct?.id || ""}
          productTitle={rfqProduct?.title || ""}
          productImage={rfqProduct?.images?.[0] || null}
          vendorName={rfqProduct?.vendorName || ""}
          listingType={Array.isArray(rfqProduct?.listingType) ? rfqProduct.listingType[0] : rfqProduct?.listingType || ""}
        />
{/* NEW CLAIM LOGIN MODAL */}
        {claimLoginVendor && (
          <div className="bs-modal-overlay" onClick={e => e.target === e.currentTarget && setClaimLoginVendor(null)}>
            <div className="bs-login-modal" role="dialog" aria-modal="true" aria-label="Login required">
              <button className="bs-login-close" onClick={() => setClaimLoginVendor(null)} aria-label="Close login prompt">
                <FiX size={14} />
              </button>
              <div className="bs-login-head">
                <div className="bs-login-icon">
                  <FiLock size={20} />
                </div>
                <div>
                  <h2 className="bs-login-title">Login required</h2>
                  <p className="bs-login-copy">
                    Please sign in to claim this business. We need an account so Sustainly can verify ownership and track the claim request.
                  </p>
                </div>
              </div>
              <div className="bs-login-actions">
                <Link href={`/login?next=${encodeURIComponent(vendorHref(claimLoginVendor.id, claimLoginVendor.slug) + "?claim=true")}`} className="bs-login-btn bs-login-btn-primary">
                  <FiUser size={14} />Login
                </Link>
                <Link href={`/register?next=${encodeURIComponent(vendorHref(claimLoginVendor.id, claimLoginVendor.slug) + "?claim=true")}`} className="bs-login-btn bs-login-btn-secondary">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </>
  );
} 