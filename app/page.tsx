"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  getDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Header from "./components/Header";
import Footer from "./components/layouts/Footer";
import {
  HiBuildingOffice2,
  HiMagnifyingGlass,
  HiClipboardDocumentList,
  HiCheckBadge,
  HiPencilSquare,
  HiBeaker,
  HiTrophy,
  HiUserGroup,
  HiEnvelope,
  HiLink,
  HiTag,
  HiChartBar
} from "react-icons/hi2";
import {
  FiSearch,
  FiPackage,
  FiUsers,
  FiTool,
  FiChevronDown,
  FiArrowRight,
  FiX,
  FiTrendingUp,
  FiStar,
} from "react-icons/fi";
import {
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineClock,
} from "react-icons/hi2";
import { MdOutlineEnergySavingsLeaf } from "react-icons/md";

/* ---------------- TYPES ---------------- */
type Product = {
  id: string;
  title: string;
  description: string;
  images?: string[];
};

type Category = {
  id: string;
  name: string;
  imageUrl?: string;
};

type Vendor = {
  id: string;
  companyName: string;
  category?: string;
  ecoScore?: number;
  ecoTier?: string; // platinum | gold | silver | bronze
  brownLensScore?: number; // out of 5
  certifications?: string[];
  location?: string;
  logoText?: string;
};

/* ---- SMART SEARCH TYPES ---- */
type SearchResult = {
  id: string;
  type: "product" | "vendor" | "service";
  label: string;
  sub?: string;
  href: string;
};

const POPULAR_SEARCHES = [
  { label: "Solar EPC", href: "/browse?q=solar+epc", type: "product" as const },
  {
    label: "EPR Compliance",
    href: "/browse?q=epr+compliance&type=Service",
    type: "service" as const,
  },
  {
    label: "Recycled Packaging",
    href: "/browse?q=recycled+packaging",
    type: "product" as const,
  },
  {
    label: "EV Charging Infrastructure",
    href: "/browse?q=ev+charging",
    type: "product" as const,
  },
  {
    label: "Water Treatment",
    href: "/browse?q=water+treatment&type=Service",
    type: "service" as const,
  },
  {
    label: "Carbon Credits",
    href: "/browse?q=carbon+credits",
    type: "product" as const,
  },
  {
    label: "ESG Consulting",
    href: "/browse?q=esg+consulting&type=Service",
    type: "service" as const,
  },
  {
    label: "ISO 14001 Vendors",
    href: "/browse?q=iso+14001&type=Vendor",
    type: "vendor" as const,
  },
];

export default function HomePage() {
  const router = useRouter();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [services, setServices] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  const [openGlobalRFQ, setOpenGlobalRFQ] = useState(false);
  const [rfqName, setRfqName] = useState("");
  const [rfqEmail, setRfqEmail] = useState("");
  const [rfqCategory, setRfqCategory] = useState("");
  const [rfqSubCategory, setRfqSubCategory] = useState("");
  const [rfqQuantity, setRfqQuantity] = useState("");
  const [rfqMessage, setRfqMessage] = useState("");
  const [rfqLoading, setRfqLoading] = useState(false);

  // Tab states
  const [howTab, setHowTab] = useState<"buyer" | "vendor" | "cert">("buyer");
  const [activeVendorFilter, setActiveVendorFilter] = useState("All Vendors");

  // Smart Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typeDropOpen, setTypeDropOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Live search
  const runSearch = useCallback(async (q: string, stype: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const results: SearchResult[] = [];
      const ql = q.toLowerCase();

      // Search products
      if (stype === "all" || stype === "product") {
        const snap = await getDocs(
          query(
            collection(db, "products"),
            where("approved", "==", true),
            where("listingType", "==", "Product"),
            orderBy("title"),
            limit(20),
          ),
        );
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if ((data.title || "").toLowerCase().includes(ql)) {
            results.push({
              id: d.id,
              type: "product",
              label: data.title,
              sub: data.categoryId,
              href: `/products/${d.id}`,
            });
          }
        });
      }

      // Search services
      if (stype === "all" || stype === "service") {
        const snap = await getDocs(
          query(
            collection(db, "products"),
            where("approved", "==", true),
            where("listingType", "==", "Service"),
            orderBy("title"),
            limit(20),
          ),
        );
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if ((data.title || "").toLowerCase().includes(ql)) {
            results.push({
              id: d.id,
              type: "service",
              label: data.title,
              sub: "Service",
              href: `/products/${d.id}`,
            });
          }
        });
      }

      // Search vendors
      if (stype === "all" || stype === "vendor") {
        const snap = await getDocs(
          query(
            collection(db, "vendors"),
            where("approved", "==", true),
            limit(30),
          ),
        );
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if (
            (data.companyName || "").toLowerCase().includes(ql) ||
            (data.category || "").toLowerCase().includes(ql)
          ) {
            results.push({
              id: d.id,
              type: "vendor",
              label: data.companyName,
              sub: data.category,
              href: `/find-vendors/${d.id}`,
            });
          }
        });
      }

      setSearchResults(results.slice(0, 8));
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handleSearchInput(val: string) {
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(() => runSearch(val, searchType), 380);
  }

  function doSearch() {
    if (!searchQuery.trim()) {
      router.push("/browse");
      return;
    }
    const typeParam =
      searchType === "all"
        ? ""
        : searchType === "vendor"
          ? "&type=Vendor"
          : searchType === "service"
            ? "&type=Service"
            : "&type=Product";
    router.push(`/browse?q=${encodeURIComponent(searchQuery)}${typeParam}`);
    setSearchFocused(false);
  }

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(
          collection(db, "categories"),
          where("active", "==", true),
        );
        const snap = await getDocs(q);
        setCategories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        );
      } catch (err) {
        console.error("HOME_CATEGORIES_ERROR", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchVendors() {
      try {
        const q = query(
          collection(db, "vendors"),
          where("approved", "==", true),
          limit(6),
        );
        const snap = await getDocs(q);
        setVendors(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (err) {
        console.error("HOME_VENDORS_ERROR", err);
      } finally {
        setLoadingVendors(false);
      }
    }
    fetchVendors();
  }, []);

  useEffect(() => {
    async function fetchAllProducts() {
      try {
        const q = query(
          collection(db, "products"),
          where("approved", "==", true),
          where("listingType", "==", "Product"),
          orderBy("createdAt", "desc"),
          limit(8),
        );
        const snap = await getDocs(q);
        setAllProducts(
          snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })),
        );
      } catch (err) {
        console.error("HOME_ALL_PRODUCTS_ERROR", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchAllProducts();
  }, []);

  useEffect(() => {
    async function fetchServices() {
      try {
        const q = query(
          collection(db, "products"),
          where("approved", "==", true),
          where("listingType", "==", "Service"),
          orderBy("createdAt", "desc"),
          limit(8),
        );
        const snap = await getDocs(q);
        setServices(
          snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })),
        );
      } catch (err) {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const q = query(
          collection(db, "blogs"),
          orderBy("createdAt", "desc"),
          limit(3),
        );
        const snap = await getDocs(q);
        setBlogs(
          snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })),
        );
      } catch (err) {
        console.error("HOME_BLOGS_ERROR", err);
      } finally {
        setLoadingBlogs(false);
      }
    }
    fetchBlogs();
  }, []);

  useEffect(() => {
    const LAST_SHOWN_KEY = "globalRFQ_lastShown";
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    const now = Date.now();
    if (!lastShown || now - Number(lastShown) > TWELVE_HOURS) {
      const timer = setTimeout(() => {
        setOpenGlobalRFQ(true);
        localStorage.setItem(LAST_SHOWN_KEY, now.toString());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function submitGlobalRFQ() {
    if (!rfqName || !rfqEmail || !rfqCategory) {
      alert("Please fill required fields");
      return;
    }
    setRfqLoading(true);
    await addDoc(collection(db, "rfqs"), {
      type: "GLOBAL",
      name: rfqName,
      email: rfqEmail,
      category: rfqCategory,
      subcategory: rfqSubCategory,
      quantity: rfqQuantity,
      message: rfqMessage,
      status: "OPEN",
      createdAt: serverTimestamp(),
    });
    setRfqLoading(false);
    setOpenGlobalRFQ(false);
    setRfqName("");
    setRfqEmail("");
    setRfqCategory("");
    setRfqSubCategory("");
    setRfqQuantity("");
    setRfqMessage("");
  }

  function getEcoBadgeClass(tier?: string) {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return "eco-badge eco-plat";
      case "gold":
        return "eco-badge eco-gold";
      case "silver":
        return "eco-badge eco-silver";
      case "bronze":
        return "eco-badge eco-bronze";
      default:
        return "eco-badge eco-silver";
    }
  }

  const staticVendors: Vendor[] = [
    {
      id: "1",
      companyName: "SolarEdge Technologies India",
      category: "Renewable Energy · Solar EPC & Systems",
      ecoScore: 94,
      ecoTier: "platinum",
      brownLensScore: 5,
      certifications: ["ISO 14001", "BEE Certified", "MNRE Approved"],
      location: "Chennai, TN",
      logoText: "SE",
    },
    {
      id: "2",
      companyName: "GreenPack Solutions Pvt Ltd",
      category: "Sustainable Packaging · Recycled Materials",
      ecoScore: 81,
      ecoTier: "gold",
      brownLensScore: 4,
      certifications: ["EPR Compliant", "FSC Certified", "GRS Certified"],
      location: "Pune, MH",
      logoText: "GP",
    },
    {
      id: "3",
      companyName: "Aqua Enviro Systems",
      category: "Water Management · ETP & STP Systems",
      ecoScore: 78,
      ecoTier: "gold",
      brownLensScore: 4,
      certifications: ["ISO 9001", "CPCB Approved", "NABL Tested"],
      location: "Bengaluru, KA",
      logoText: "AE",
    },
  ];

  const displayVendors =
    vendors.length > 0 ? vendors.slice(0, 3) : staticVendors;

  const vendorFilters = [
    "All Vendors",
    "Platinum",
    "Gold",
    "Tamil Nadu",
    "Maharashtra",
    "Renewable Energy",
    "Packaging",
    "EPR Compliant",
  ];

  const howVendorSteps = [
  {
    num: "01",
    icon: <HiPencilSquare size={22} />,
    title: "Submit your profile",
    desc: "Register your business, upload certifications, and describe your sustainable products or services.",
  },
  {
    num: "02",
    icon: <HiBeaker size={22} />,
    title: "Brown Lens review",
    desc: "Our team verifies your sustainability claims across all 5 criteria before your listing goes live.",
  },
  {
    num: "03",
    icon: <HiTrophy size={22} />,
    title: "Receive Eco Score",
    desc: "Get a Bronze, Silver, Gold, or Platinum Eco Score badge that builds instant buyer trust.",
  },
  {
    num: "04",
    icon: <HiUserGroup size={22} />,
    title: "Connect & convert",
    desc: "Receive RFQs from corporate buyers, respond to inquiries, and grow your B2B enterprise pipeline.",
  },
];

const howBuyerSteps = [
  {
    num: "01",
    icon: <HiBuildingOffice2 size={22} />,
    title: "Register your company",
    desc: "Create a verified corporate buyer account with your GST details and procurement categories.",
  },
  {
    num: "02",
    icon: <HiMagnifyingGlass size={22} />,
    title: "Search & filter vendors",
    desc: "Browse by category, Eco Score tier, certification, location, and minimum order quantity.",
  },
  {
    num: "03",
    icon: <HiClipboardDocumentList size={22} />,
    title: "Raise an RFQ",
    desc: "Send a Request for Quotation directly to one or multiple verified vendors simultaneously.",
  },
  {
    num: "04",
    icon: <HiCheckBadge size={22} />,
    title: "Verify & close",
    desc: "Review compliance docs, compare quotes, and finalise procurement with full BRSR-ready documentation.",
  },
];

const howCertSteps = [
  {
    num: "01",
    icon: <HiEnvelope size={22} />,
    title: "Apply for partnership",
    desc: "Submit your certification framework, accreditation documents, and partner application for review.",
  },
  {
    num: "02",
    icon: <HiLink size={22} />,
    title: "Integrate standards",
    desc: "Your certification criteria are mapped and embedded into our Brown Lens verification framework.",
  },
  {
    num: "03",
    icon: <HiTag size={22} />,
    title: "Co-brand on badges",
    desc: "Your logo appears on the Eco Score badges of all vendors certified under your framework.",
  },
  {
    num: "04",
    icon: <HiChartBar size={22} />,
    title: "Expand your reach",
    desc: "Access our 500+ corporate buyer network and scale your certification program's visibility across India.",
  },
];

  const activeHowSteps =
    howTab === "buyer"
      ? howBuyerSteps
      : howTab === "vendor"
        ? howVendorSteps
        : howCertSteps;

  const staticCategories = [
    { id: "s1", name: "Renewable Energy", count: "84 vendors", icon: "☀️" },
    {
      id: "s2",
      name: "Sustainable Packaging",
      count: "67 vendors",
      icon: "📦",
    },
    { id: "s3", name: "Green Mobility", count: "42 vendors", icon: "🚗" },
    { id: "s4", name: "Water Management", count: "38 vendors", icon: "💧" },
    { id: "s5", name: "Waste Management", count: "55 vendors", icon: "♻️" },
    { id: "s6", name: "Sustainable Textiles", count: "49 vendors", icon: "👕" },
    { id: "s7", name: "Green Construction", count: "31 vendors", icon: "🏗️" },
    { id: "s8", name: "Agri & Food", count: "44 vendors", icon: "🌾" },
  ];

  const staticCategories2 = [
    { id: "s9", name: "Energy Storage", count: "27 vendors", icon: "🔋" },
    { id: "s10", name: "Carbon Credits", count: "19 vendors", icon: "🌡️" },
    { id: "s11", name: "Clean Manufacturing", count: "36 vendors", icon: "🏭" },
    { id: "s12", name: "Energy Efficiency", count: "41 vendors", icon: "💡" },
    { id: "s13", name: "Green Chemicals", count: "22 vendors", icon: "🧪" },
    { id: "s14", name: "ESG Consulting", count: "33 vendors", icon: "📊" },
  ];

  const displayCategoriesRow1 =
    categories.length > 0
      ? categories
          .slice(0, 8)
          .map((c) => ({
            id: c.id,
            name: c.name,
            count: "",
            icon: "🌿",
            imageUrl: c.imageUrl,
          }))
      : staticCategories;

  const displayCategoriesRow2 =
    categories.length > 8
      ? categories
          .slice(8, 14)
          .map((c) => ({
            id: c.id,
            name: c.name,
            count: "",
            icon: "🌿",
            imageUrl: c.imageUrl,
          }))
      : staticCategories2;

  return (
    <main style={{ background: "var(--white)" }}>
      <Header />

      {/* ═══════════════════════════════════════ HERO ═══════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-blob blob1" />
        <div className="hero-blob blob2" />
        <div className="hero-blob blob3" />
        <div className="hero-grid" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            India's First Verified B2B Sustainable Marketplace
          </div>

          <h1 className="hero-h1">
            <span className="green">Source verified.</span>
            <br />
            Sell sustainably.
            <br />
            <span className="italic">Grow responsibly.</span>
          </h1>

          <p className="hero-sub">
            Connecting <b>corporate procurement teams</b> with{" "}
            <b>ESG-verified vendors</b> — every sourcing decision backed by
            proof, not promises.
          </p>

          {/* ===== SMART SEARCH BAR ===== */}
          <style>{`
            .smart-search-wrap { position: relative; width: 750px; z-index: 40; }
            .smart-search-bar {
              display: flex;
              align-items: center;
              background: rgba(255,255,255,0.07);
              border: 1.5px solid rgba(255,255,255,0.14);
              border-radius: 16px;
              overflow: visible;
              backdrop-filter: blur(16px);
              transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
            }
            .smart-search-bar:focus-within {
              border-color: var(--g, #1db954);
              background: rgba(255,255,255,0.1);
              box-shadow: 0 0 0 4px rgba(29,185,84,0.12);
            }
            .ss-type-select {
              display: flex;
              align-items: center;
              gap: 5px;
              padding: 0 14px 0 16px;
              height: 52px;
              border-right: 1px solid rgba(255,255,255,0.1);
              cursor: pointer;
              flex-shrink: 0;
              position: relative;
            }
            .ss-type-label {
              font-size: 13px;
              font-weight: 600;
              color: rgba(255,255,255,0.75);
              white-space: nowrap;
              user-select: none;
            }
            .ss-type-chevron { color: rgba(255,255,255,0.4); flex-shrink: 0; }
            .ss-type-dropdown {
              position: absolute;
              top: calc(100% + 10px);
              left: 0;
              background: #1a2e1f;
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 12px;
              overflow: hidden;
              min-width: 160px;
              box-shadow: 0 8px 30px rgba(0,0,0,0.4);
              z-index: 50;
            }
            .ss-type-opt {
              display: flex;
              align-items: center;
              gap: 9px;
              padding: 10px 16px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              color: rgba(255,255,255,0.7);
              border: none;
              background: none;
              width: 100%;
              font-family: inherit;
              transition: background 0.12s, color 0.12s;
            }
            .ss-type-opt:hover { background: rgba(255,255,255,0.07); color: #fff; }
            .ss-type-opt.active { background: rgba(29,185,84,0.15); color: var(--g, #1db954); font-weight: 700; }
            .ss-input-wrap { flex: 1; position: relative; }
            .ss-input {
              width: 100%;
              height: 52px;
              background: none;
              border: none;
              outline: none;
              color: #fff;
              font-size: 15px;
              font-family: inherit;
              padding: 0 12px;
            }
            .ss-input::placeholder { color: rgba(255,255,255,0.35); }
            .ss-clear {
              width: 26px; height: 26px;
              border-radius: 7px;
              background: rgba(255,255,255,0.08);
              border: none; cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              color: rgba(255,255,255,0.5);
              margin-right: 8px;
              flex-shrink: 0;
              transition: background 0.15s;
            }
            .ss-clear:hover { background: rgba(255,255,255,0.16); color: #fff; }
            .ss-search-btn {
              height: 52px;
              padding: 0 22px;
              background: var(--g, #1db954);
              border: none;
              border-radius: 0 14px 14px 0;
              color: #fff;
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              font-family: inherit;
              flex-shrink: 0;
              transition: background 0.15s;
            }
            .ss-search-btn:hover { background: var(--g2, #16a34a); }

            /* Dropdown panel */
            .ss-dropdown {
              position: absolute;
              top: calc(100% + 10px);
              left: 0;
              right: 0;
              background: #fff;
              border: 1px solid rgba(0,0,0,0.09);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 16px 50px rgba(0,0,0,0.18);
              z-index: 50;
            }
            .ss-drop-head {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 12px 16px 8px;
              font-size: 11px;
              font-weight: 700;
              color: #888;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              border-bottom: 1px solid rgba(0,0,0,0.05);
            }
            .ss-drop-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 11px 16px;
              text-decoration: none;
              transition: background 0.12s;
              cursor: pointer;
              border: none;
              background: none;
              width: 100%;
              font-family: inherit;
              text-align: left;
            }
            .ss-drop-item:hover { background: rgba(0,0,0,0.03); }
            .ss-item-icon {
              width: 32px; height: 32px;
              border-radius: 8px;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
              font-size: 13px;
            }
            .ss-item-icon.product { background: rgba(59,130,246,0.1); color: #3b82f6; }
            .ss-item-icon.vendor { background: rgba(29,185,84,0.1); color: var(--g, #1db954); }
            .ss-item-icon.service { background: rgba(168,85,247,0.1); color: #a855f7; }
            .ss-item-label {
              font-size: 13.5px;
              font-weight: 600;
              color: var(--text, #111);
              flex: 1;
            }
            .ss-item-sub {
              font-size: 11px;
              color: #888;
            }
            .ss-item-type-badge {
              font-size: 10px;
              font-weight: 700;
              padding: 2px 7px;
              border-radius: 50px;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }
            .ss-item-type-badge.product { background: rgba(59,130,246,0.1); color: #3b82f6; }
            .ss-item-type-badge.vendor { background: rgba(29,185,84,0.1); color: var(--g2, #16a34a); }
            .ss-item-type-badge.service { background: rgba(168,85,247,0.1); color: #a855f7; }
            .ss-popular-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              padding: 12px 16px 14px;
            }
            .ss-popular-pill {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 5px 12px;
              border-radius: 50px;
              font-size: 12px;
              font-weight: 600;
              color: var(--text2, #555);
              background: rgba(0,0,0,0.05);
              text-decoration: none;
              border: none;
              cursor: pointer;
              font-family: inherit;
              transition: background 0.12s, color 0.12s;
            }
            .ss-popular-pill:hover { background: rgba(29,185,84,0.1); color: var(--g2, #16a34a); }
            .ss-loading {
              padding: 16px;
              text-align: center;
              font-size: 13px;
              color: #888;
            }
            .ss-no-results {
              padding: 16px;
              text-align: center;
              font-size: 13px;
              color: #888;
            }
            .ss-see-all {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 11px;
              font-size: 13px;
              font-weight: 700;
              color: var(--g2, #16a34a);
              border-top: 1px solid rgba(0,0,0,0.06);
              text-decoration: none;
              cursor: pointer;
              border: none;
              background: none;
              font-family: inherit;
              width: 100%;
              transition: background 0.12s;
            }
            .ss-see-all:hover { background: rgba(29,185,84,0.05); }
          `}</style>

          {(() => {
            const typeOpts = [
              {
                val: "all",
                label: "All Categories",
                icon: <HiOutlineSparkles size={14} />,
              },
              {
                val: "product",
                label: "Products",
                icon: <FiPackage size={14} />,
              },
              { val: "vendor", label: "Vendors", icon: <FiUsers size={14} /> },
              { val: "service", label: "Services", icon: <FiTool size={14} /> },
            ];
            const selectedType =
              typeOpts.find((t) => t.val === searchType) || typeOpts[0];

            return (
              <div className="smart-search-wrap" ref={searchRef}>
                <div className="smart-search-bar">
                  {/* Type selector */}
                  <div
                    className="ss-type-select"
                    onClick={() => setTypeDropOpen((o) => !o)}
                  >
                    {selectedType.icon}
                    <span className="ss-type-label">{selectedType.label}</span>
                    <FiChevronDown size={12} className="ss-type-chevron" />
                    {typeDropOpen && (
                      <div className="ss-type-dropdown">
                        {typeOpts.map((opt) => (
                          <button
                            key={opt.val}
                            className={`ss-type-opt${searchType === opt.val ? " active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchType(opt.val);
                              setTypeDropOpen(false);
                              if (searchQuery) runSearch(searchQuery, opt.val);
                            }}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="ss-input-wrap">
                    <input
                      className="ss-input"
                      type="text"
                      placeholder={
                        searchType === "vendor"
                          ? "Search vendors by name, category, location…"
                          : searchType === "service"
                            ? "Search services like ESG consulting, EPR…"
                            : searchType === "product"
                              ? "Search products like solar panels, packaging…"
                              : "Search vendors, products, services, certifications…"
                      }
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") doSearch();
                      }}
                      autoComplete="off"
                    />
                  </div>

                  {/* Clear */}
                  {searchQuery && (
                    <button
                      className="ss-clear"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <FiX size={12} />
                    </button>
                  )}

                  {/* Search button */}
                  <button className="ss-search-btn" onClick={doSearch}>
                    <FiSearch size={14} />
                    Search
                  </button>
                </div>

                {/* Dropdown panel */}
                {searchFocused && (
                  <div className="ss-dropdown">
                    {searchLoading && (
                      <div className="ss-loading">Searching…</div>
                    )}

                    {!searchLoading &&
                      searchQuery.trim() &&
                      searchResults.length > 0 && (
                        <>
                          <div className="ss-drop-head">
                            <FiSearch size={11} /> Results
                          </div>
                          {searchResults.map((r) => (
                            <Link
                              key={r.id}
                              href={r.href}
                              className="ss-drop-item"
                              onClick={() => setSearchFocused(false)}
                            >
                              <div className={`ss-item-icon ${r.type}`}>
                                {r.type === "vendor" ? (
                                  <FiUsers size={14} />
                                ) : r.type === "service" ? (
                                  <FiTool size={14} />
                                ) : (
                                  <FiPackage size={14} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="ss-item-label">{r.label}</div>
                                {r.sub && (
                                  <div className="ss-item-sub">{r.sub}</div>
                                )}
                              </div>
                              <span className={`ss-item-type-badge ${r.type}`}>
                                {r.type}
                              </span>
                            </Link>
                          ))}
                          <button className="ss-see-all" onClick={doSearch}>
                            See all results for &ldquo;{searchQuery}&rdquo;{" "}
                            <FiArrowRight size={13} />
                          </button>
                        </>
                      )}

                    {!searchLoading &&
                      searchQuery.trim() &&
                      searchResults.length === 0 && (
                        <div className="ss-no-results">
                          No results found.{" "}
                          <Link
                            href={`/browse?q=${encodeURIComponent(searchQuery)}`}
                            style={{ color: "var(--g2)" }}
                            onClick={() => setSearchFocused(false)}
                          >
                            Browse all →
                          </Link>
                        </div>
                      )}

                    {!searchLoading && !searchQuery.trim() && (
                      <>
                        <div className="ss-drop-head">
                          <FiTrendingUp size={11} /> Popular Searches
                        </div>
                        <div className="ss-popular-grid">
                          {POPULAR_SEARCHES.map((p) => (
                            <Link
                              key={p.label}
                              href={p.href}
                              className="ss-popular-pill"
                              onClick={() => setSearchFocused(false)}
                            >
                              {p.type === "vendor" ? (
                                <FiUsers size={11} />
                              ) : p.type === "service" ? (
                                <FiTool size={11} />
                              ) : (
                                <FiPackage size={11} />
                              )}
                              {p.label}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="hero-cta-row">
            <Link href="/register?role=BUYER" className="hcta hcta-buyer">
              {" "}
              I'm a Buyer — Start Sourcing
            </Link>
            <Link href="/register?role=VENDOR" className="hcta hcta-vendor">
              {" "}
              I'm a Vendor — Get Listed
            </Link>
          </div>
        </div>

        <div className="hero-stats">
          {/* <div className="hstat">
            <div className="hstat-num">
              450<span>+</span>
            </div>
            <div className="hstat-lbl">Verified Vendors</div>
          </div> */}
          <div className="hstat">
            <div className="hstat-num">
              16<span>+</span>
            </div>
            <div className="hstat-lbl">Categories</div>
          </div>
          {/* <div className="hstat">
            <div className="hstat-num">
              500<span>+</span>
            </div>
            <div className="hstat-lbl">Corporate Buyers</div>
          </div> */}
          <div className="hstat">
            <div className="hstat-num">5</div>
            <div className="hstat-lbl">Verification Criteria</div>
          </div>
          <div className="hstat">
            <div className="hstat-num" style={{ color: "var(--g)" }}>
              0
            </div>
            <div className="hstat-lbl">Greenwashing Tolerated</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ TRUST MARQUEE ═══════════════════════════════════════ */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[
            <>
              <svg viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                />
                <polyline
                  points="4,7 6,9 10,5"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <b>Brown Lens Verified</b> — Anti-Greenwashing Standard
            </>,
            <>
              <svg viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                />
                <polyline
                  points="4,7 6,9 10,5"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              ISO 14001 · GRS · FSC · BEE · CPCB Accepted
            </>,
            <>
              <svg viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                />
                <polyline
                  points="4,7 6,9 10,5"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <b>BRSR-Ready</b> Compliance Reports
            </>,
            <>
              <svg viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                />
                <polyline
                  points="4,7 6,9 10,5"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <b>EPR Compliance</b> Vendors Available
            </>,
            <>
              <svg viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                />
                <polyline
                  points="4,7 6,9 10,5"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              RFQ System · Bulk Inquiry · Direct Connect
            </>,
            <>
              <svg viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                />
                <polyline
                  points="4,7 6,9 10,5"
                  stroke="#1DB954"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <b>India HQ</b> — Chennai, Tamil Nadu
            </>,
          ].flatMap((item, i) => [
            <div key={`a-${i}`} className="mitem">
              {item}
            </div>,
            <div key={`b-${i}`} className="mitem">
              {item}
            </div>,
          ])}
        </div>
      </div>

      {/* ═══════════════════════════════════════ CATEGORIES ═══════════════════════════════════════ */}
      <section className="sec cat-sec">
        <div className="container">
          <div className="sec-head-row">
            <div>
              <div className="sec-eye">Browse Platform</div>
              <h2 className="sec-h">
                All <b>Categories</b>
              </h2>
              <p className="sec-sub">
                Every category is verified, compliance-ready, and built
                exclusively for corporate B2B procurement.
              </p>
            </div>
            <Link href="/categories" className="link-all">
              View all categories →
            </Link>
          </div>

          <div className="cat-grid">
            {[...displayCategoriesRow1, ...displayCategoriesRow2]
              .slice(0, 12)
              .map((c: any) => (
                <div
                  key={c.id}
                  className="cat-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/browse?category=${c.id}`)}
                >
                  <div className="cat-icon">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} />
                    ) : (
                      c.icon
                    )}
                  </div>
                  <div className="cat-name">{c.name}</div>
                  {c.count && <div className="cat-count">{c.count}</div>}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ VERIFIED VENDORS ═══════════════════════════════════════ */}
      <section className="sec vendors-sec">
        <div className="container">
          <div className="sec-head-row">
            <div>
              <div className="sec-eye">Vendor Spotlight</div>
              <h2 className="sec-h">
                Top-rated <b>verified suppliers</b>
              </h2>
              <p className="sec-sub">
                Hand-picked vendors who passed all 5 Brown Lens criteria. Ready
                for corporate RFQs.
              </p>
            </div>
            <Link href="/browse?type=vendor" className="link-all">
              Browse all vendors →
            </Link>
          </div>

          <div className="vendor-grid">
            {displayVendors.slice(0, 4).map((v) => (
              <div key={v.id} className="vc">
                <div className="vc-top">
                  <div className="vc-logo">
                    {v.logoText ||
                      (v.companyName || "").slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="vc-body">
                  <div className="vc-name">{v.companyName}</div>
                  <div className="vc-loc" style={{ marginTop: '8px' }}>
                    <svg viewBox="0 0 12 14" fill="none">
                      <path
                        d="M6 1C3.79 1 2 2.79 2 5C2 8.5 6 13 6 13C6 13 10 8.5 10 5C10 2.79 8.21 1 6 1Z"
                        stroke="currentColor"
                        strokeWidth={1.3}
                      />
                      <circle
                        cx="6"
                        cy="5"
                        r="1.5"
                        stroke="currentColor"
                        strokeWidth={1.3}
                      />
                    </svg>
                    {v.location || "India"}
                  </div>
                </div>
                <div className="vc-footer">
                  <button
                    className="btn-rfq"
                    onClick={() => router.push(`/vendor/${v.id}`)}
                  >
                    Send RFQ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ HOW IT WORKS ═══════════════════════════════════════ */}
      <section className="sec how-sec">
        <div className="container">
          <div className="sec-head-row">
            <div>
              <div className="sec-eye">Platform Workflow</div>
              <h2 className="sec-h">
                How <b>Sustainly Green</b> works
              </h2>
              <p className="sec-sub">
                Structured sustainable procurement for Indian corporates — verified suppliers, BRSR-aligned data, zero greenwashing risk.
              </p>
            </div>
          </div>

          <div className="how-tabs-wrap">
            {(["buyer", "vendor", "cert"] as const).map((tab) => (
              <button
                key={tab}
                className={`htab${howTab === tab ? " on" : ""}`}
                onClick={() => setHowTab(tab)}
              >
                {tab === "buyer"
                  ? "For Buyers"
                  : tab === "vendor"
                    ? "For Vendors"
                    : "For Cert Bodies"}
              </button>
            ))}
          </div>

          <div className="how-steps">
            {activeHowSteps.map((step, i) => (
              <div
                key={step.num}
                className={`how-step${i === 0 ? " active" : ""}`}
              >
                <div className="how-num">{step.num}</div>
                <div className="how-icon">{step.icon}</div>
                <div className="how-title">{step.title}</div>
                <div className="how-desc">{step.desc}</div>
                {i < 3 && <div className="how-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ WHY US ═══════════════════════════════════════ */}
      <section className="why-sec">
        <div className="why-blob wb1" />
        <div className="why-blob wb2" />
        <div className="container">
          <div className="why-inner">
            <div className="why-left">
              <div className="sec-eye">Our Competitive Edge</div>
              <h2 className="sec-h" style={{ color: "#fff" }}>
                The <b style={{ color: "var(--g)" }}>Verified Sustainable Sourcing Gap</b> We Solve
              </h2>
              <p className="sec-sub">
                Sustainly Green is the only verified sustainable sourcing platform that combines audited vendor discovery, BRSR-aligned data, and direct RFQ — built exclusively for India's corporate procurement teams.
              </p>
              <div className="why-feats">
                <div className="wf">
                  <div className="wf-icon">🔬</div>
                  <div>
                    <div className="wf-title">
                      Anti-Greenwashing Gate
                    </div>
                    <div className="wf-desc">
                      Every vendor clears a 5-criterion pass/fail verification.
                      No unverified claims reach buyers.
                    </div>
                  </div>
                </div>
                <div className="wf">
                  <div className="wf-icon">🏅</div>
                  <div>
                    <div className="wf-title">
                      Certification Supports System
                    </div>
                    <div className="wf-desc">
                      When you are compliant, you are 100% verified and trusted.
                    </div>
                  </div>
                </div>
                <div className="wf">
                  <div className="wf-icon">🤝</div>
                  <div>
                    <div className="wf-title">Three-sided marketplace</div>
                    <div className="wf-desc">
                      Buyers, verified vendors, and certification bodies on one
                      connected platform. A first in India.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="compare-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th className="hl">Sustainly Green</th>
                    <th>Others</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["B2B Marketplace", "✓", "✓"],
                    ["Sustainability-only", "✓", "✗"],
                    ["Anti-greenwashing check", "✓", "✗"],
                    ["RFQ & bulk inquiry", "✓", "✓"],
                    ["India-first platform", "✓", "✓"],
                    ["BRSR reporting support", "✓", "✗"],
                  ].map(([feat, us, Others]) => (
                    <tr key={feat}>
                      <td>{feat}</td>
                      <td className="hl cy">{us}</td>
                      <td
                        className={
                          Others === "✓"
                            ? "cy"
                            : Others === "✗"
                              ? "cn"
                              : "cm"
                        }
                      >
                        {Others}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ BROWN LENS ═══════════════════════════════════════ */}
      <section className="sec bl-sec">
        <div className="container">
          <div className="sec-head-row">
            <div>
              <div className="sec-eye">Proprietary Standard</div>
              <h2 className="sec-h">
                The <b>Brown Lens</b> Framework
              </h2>
              <p className="sec-sub">
                5 criteria. Pass all or don't list. The only anti-greenwashing
                gate for B2B sustainable procurement in India.
              </p>
            </div>
          </div>
          <div className="bl-grid">
            <div className="bl-criteria">
              {[
                {
                  n: 1,
                  title: "Environmental Certification",
                  desc: "Valid third-party cert (ISO 14001, GRS, FSC, BEE, CPCB or equivalent) must be current and verifiable.",
                },
                {
                  n: 2,
                  title: "Sustainability Claims Verification",
                  desc: "All marketing claims cross-checked against actual certificates, lab reports, or audit documentation.",
                },
                {
                  n: 3,
                  title: "Business Legitimacy Check",
                  desc: "MCA registration, GST filing status, and director profile verified to confirm entity credibility.",
                },
                {
                  n: 4,
                  title: "Supply Chain Transparency",
                  desc: "Vendor must disclose material or service origin and demonstrate responsible sourcing practices.",
                },
              ].map((c) => (
                <div key={c.n} className="blc">
                  <div className="blc-num">{c.n}</div>
                  <div>
                    <h5>{c.title}</h5>
                    <p>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="bl-panel">
                <div className="bl-panel-badge">🔬 Brown Lens Verified</div>
                <h3>Built to end greenwashing in B2B procurement</h3>
                <p>
                  Most platforms accept anyone who claims to be sustainable.
                  Brown Lens was built to change that — named after the
                  principle of seeing through the green surface to what's
                  actually underneath.
                </p>
                <p>
                  Pass all 4 criteria, get verified. Fail even one — you
                  don't list. No exceptions. No workarounds.
                </p>
                <Link href="/brown-lens" className="bl-cta">
                  <span>Apply for Brown Lens Verification</span>
                  <span className="bl-cta-arr">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ TESTIMONIALS ═══════════════════════════════════════ */}
      <section className="sec testi-sec">
        <div className="container">
          <div className="sec-head-row">
            <div>
              <div className="sec-eye">Social Proof</div>
              <h2 className="sec-h">
                Trusted across <b>India</b>
              </h2>
            </div>
          </div>
          <div className="testi-grid">
            {[
              {
                initials: "RS",
                name: "Rohit Sharma",
                role: "Head of Procurement, Tata Projects",
                type: "Buyer",
                quote:
                  "Reduced our sustainable sourcing research time by 60%. The Brown Lens verification means we don't have to do our own due diligence on every claim.",
              },
              {
                initials: "PM",
                name: "Priya Menon",
                role: "Founder, GreenPack Solutions",
                type: "Vendor",
                quote:
                  "Our Eco Score badge became a competitive differentiator in enterprise pitches. Buyers trust it because it's independently verified, not self-declared.",
              },
              {
                initials: "AK",
                name: "Amit Krishnan",
                role: "ESG Manager, Mahindra Group",
                type: "Buyer",
                quote:
                  "Finally a platform built for B2B ESG procurement. The RFQ system and compliance documentation is exactly what our team needed for BRSR reporting.",
              },
            ].map((t) => (
              <div key={t.name} className="tc">
                <div className="tc-stars">★★★★★</div>
                <p className="tc-quote">{t.quote}</p>
                <div className="tc-person">
                  <div className="tc-av">{t.initials}</div>
                  <div>
                    <div className="tc-name">{t.name}</div>
                    <div className="tc-role">{t.role}</div>
                  </div>
                  <span
                    className={`tc-type ${t.type === "Buyer" ? "tc-buyer" : "tc-vendor"}`}
                  >
                    {t.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ PRICING ═══════════════════════════════════════ */}
      <section className="sec price-sec">
        <div className="container">
          <div className="sec-eye">Vendor Plans</div>
          <h2 className="sec-h">
            <b>Pricing</b>
          </h2>
          <p className="sec-sub" style={{ marginBottom: 0 }}>
            Transparent, flexible plans for every stage of growth.
          </p>

          <div className="price-grid" style={{ marginTop: 40 }}>
            {[
              {
                tier: "Free",
                name: "Free",
                desc: "For vendors starting their sustainable journey.",
                price: "₹0",
                period: "forever free",
                pop: false,
                feats: [
                  "Unlimited product listings",
                  "Business Verification",
                  "Vendor profile page",
                  "Dashboard analytics",
                  "Export reports",
                  "1 RFQ response per month",
                  "Self-declared certification",
                ],
                btnClass: "pc-btn-out",
                btnText: "Get Started Free",
                href: "/register?role=VENDOR&plan=free",
              },
              {
                tier: "Starter",
                name: "Starter",
                desc: "For growing vendors expanding their reach.",
                price: "₹999",
                period: "per month / ₹9,990 per year",
                pop: false,
                feats: [
                  "Unlimited product listings",
                  "Business Verification",
                  "Vendor profile page",
                  "Dashboard analytics",
                  "Export reports",
                  "5 RFQ responses per month",
                  "Self-declared certification",
                  "24 hrs response time SLA",
                ],
                btnClass: "pc-btn-out",
                btnText: "Start Starter Plan",
                href: "/pricing",
              },
              {
                tier: "Grow",
                name: "Grow",
                desc: "For vendors seeking market leadership.",
                price: "₹1,999",
                period: "per month / ₹19,990 per year",
                pop: true,
                feats: [
                  "Unlimited product listings",
                  "Sustainly Verified Seal",
                  "Brown Lens Review",
                  "6 images per listing",
                  "Video upload per listing",
                  "Featured listings",
                  "5 certifications upload",
                  "Sustainly verified certification",
                  "Basic carbon footprint support",
                  "20 RFQ responses per month",
                  "Custom vendor URL",
                  "Company story section",
                  "12 hrs response time SLA",
                  "Priority onboarding support",
                ],
                btnClass: "pc-btn-solid",
                btnText: "Get Grow Plan",
                href: "/pricing",
              },
              {
                tier: "Enterprise",
                name: "Enterprise",
                desc: "For large organizations with premium needs.",
                price: "₹3,499",
                period: "per month / ₹34,999 per year",
                pop: false,
                feats: [
                  "Unlimited product listings",
                  "Sustainly Verified Seal",
                  "Brown Lens Review",
                  "10 images per listing",
                  "Unlimited video uploads",
                  "Featured listings",
                  "Unlimited certification upload",
                  "Sustainly verified certification",
                  "Advanced carbon footprint support",
                  "Unlimited RFQ responses",
                  "Custom vendor URL",
                  "Company story section",
                  "2 hrs response time SLA",
                  "Complete certification support",
                  "Dedicated account manager",
                  "Priority onboarding support",
                ],
                btnClass: "pc-btn-out",
                btnText: "Contact Sales",
                href: "/contact",
              },
            ].map((plan) => (
              <div key={plan.name} className={`pc${plan.pop ? " pop" : ""}`}>
                {plan.pop && <div className="pop-label">Most Popular</div>}
                <div className="pc-tier">{plan.tier}</div>
                <div className="pc-name">{plan.name}</div>
                <div className="pc-desc">{plan.desc}</div>
                <div className="pc-price">{plan.price}</div>
                <div className="pc-period">{plan.period}</div>
                <ul className="pc-feats">
                  {plan.feats.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link href={plan.href} className={`pc-btn ${plan.btnClass}`}>
                  {plan.btnText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ FINAL CTA ═══════════════════════════════════════ */}
      <section className="fcta-sec">
        <div className="fcta-blob1" />
        <div className="fcta-blob2" />
        <div className="fcta-inner">
          <div className="fcta-top">
            <h2 className="fcta-h">
              Ready to build a<br />
              <span className="green">verified</span> supply chain?
            </h2>
            <p className="fcta-sub">
              Join India's only marketplace where every supplier is verified,
              every claim is checked, and every deal is backed by proof.
            </p>
          </div>
          <div className="fcta-cards">
            <div className="fcta-card">
              {/* <div className="fcta-card-icon">🏢</div> */}
              <h3>Start sourcing sustainably</h3>
              <p>
                Access verified vendors across multiple categories. Raise RFQs,
                and meet your ESG procurement targets — all
                in one platform.
              </p>
              <Link href="/register?role=BUYER" className="fcta-card-btn">
                Register as a Buyer →
              </Link>
            </div>
            <div className="fcta-card">
              {/* <div className="fcta-card-icon">🌿</div> */}
              <h3>Grow your B2B pipeline</h3>
              <p>
                Get verified, and connect
                directly with corporate procurement teams who are actively
                sourcing sustainable solutions.
              </p>
              <Link href="/register?role=VENDOR" className="fcta-card-btn dark">
                Onboard as a Vendor →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ LATEST BLOGS ═══════════════════════════════════════ */}
      {blogs.length > 0 && (
        <section className="sec" style={{ background: "var(--off)" }}>
          <div className="container">
            <div className="sec-head-row">
              <div>
                <div className="sec-eye">Insights</div>
                <h2 className="sec-h">
                  Latest from our <b>Blog</b>
                </h2>
              </div>
              <Link href="/blogs" className="link-all">
                View all →
              </Link>
            </div>
            <div className="testi-grid">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blogs/${blog.id}`}
                  className="tc"
                  style={{ textDecoration: "none" }}
                >
                  {blog.image && (
                    <div
                      style={{
                        height: 160,
                        borderRadius: 12,
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      <img
                        src={blog.image}
                        alt={blog.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                  <div className="tc-name" style={{ fontSize: 16 }}>
                    {blog.title}
                  </div>
                  <p
                    className="tc-role"
                    style={{ fontSize: 13, lineHeight: 1.6 }}
                  >
                    {blog.content?.replace(/<[^>]+>/g, "").slice(0, 120)}...
                  </p>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--g2)",
                    }}
                  >
                    Read More →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* ═══════════════════════════════════════ GLOBAL RFQ MODAL ═══════════════════════════════════════ */}
      {openGlobalRFQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenGlobalRFQ(false)}
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)] p-8 space-y-6">
            <button
              onClick={() => setOpenGlobalRFQ(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
            <div>
              <h2
                className="text-2xl font-semibold"
                style={{ color: "var(--text)" }}
              >
                Tell Us What You Need
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>
                Receive quotes from verified sustainable vendors.
              </p>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Full Name *"
                value={rfqName}
                onChange={(e) => setRfqName(e.target.value)}
                className="rfq-input"
              />
              <input
                placeholder="Email *"
                value={rfqEmail}
                onChange={(e) => setRfqEmail(e.target.value)}
                className="rfq-input"
              />
              <select
                value={rfqCategory}
                onChange={(e) => setRfqCategory(e.target.value)}
                className="rfq-input"
              >
                <option value="">Select Category *</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Subcategory"
                value={rfqSubCategory}
                onChange={(e) => setRfqSubCategory(e.target.value)}
                className="rfq-input"
              />
              <input
                placeholder="Quantity"
                value={rfqQuantity}
                onChange={(e) => setRfqQuantity(e.target.value)}
                className="rfq-input"
              />
              <textarea
                placeholder="Additional details"
                value={rfqMessage}
                onChange={(e) => setRfqMessage(e.target.value)}
                className="rfq-input h-24 resize-none"
              />
            </div>
            <button
              onClick={submitGlobalRFQ}
              style={{
                background: "var(--g)",
                color: "#fff",
                width: "100%",
                padding: "13px",
                borderRadius: 50,
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
              }}
            >
              {rfqLoading ? "Submitting..." : "Submit Requirement"}
            </button>
            <p
              className="text-xs text-center"
              style={{ color: "var(--text3)" }}
            >
              Your request will be shared only with verified vendors.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
