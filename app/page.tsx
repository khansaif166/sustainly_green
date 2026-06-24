"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchActiveCategories,
  fetchApprovedProducts,
  fetchApprovedVendors,
} from "@/lib/supabasePublic";
import {
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_SESSION_SAVED_EVENT,
  ensureCurrentProfile,
  getCurrentUser,
  getStoredSession,
  redirectForRole,
  signOutSupabase,
  type SupabaseProfile,
} from "@/lib/supabaseAuth";
import Footer from "./components/layouts/Footer";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Globe,
  Leaf,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tractor,
  UserRound,
  Zap,
} from "lucide-react";

type CategoryItem = {
  id: string;
  name: string;
  icon: string;
};

type ProductCard = {
  id: string;
  title: string;
  price: string;
  unit: string;
  vendor: string;
  image?: string;
};

type SupplierCard = {
  id: string;
  name: string;
  country: string;
  rating: string;
  mark: string;
  isUnclaimed?: boolean;
};

const sidebarCategories: CategoryItem[] = [
  { id: "renewable-energy", name: "Renewable Energy", icon: "sun" },
  { id: "energy-efficiency", name: "Energy Efficiency", icon: "zap" },
  { id: "water-wastewater", name: "Water & Wastewater", icon: "drop" },
  { id: "waste-management", name: "Waste Management", icon: "recycle" },
  { id: "green-building", name: "Green Building", icon: "building" },
  { id: "sustainable-materials", name: "Sustainable Materials", icon: "hex" },
  { id: "eco-packaging", name: "Eco Packaging", icon: "box" },
  { id: "electric-mobility", name: "Electric Mobility", icon: "truck" },
  { id: "agriculture-organic", name: "Agriculture & Organic", icon: "sprout" },
  { id: "environmental-monitoring", name: "Environmental Monitoring", icon: "chart" },
];

const quickActions = [
  {
    title: "Post Requirement",
    text: "Share your need and get quotes from verified suppliers.",
  },
  {
    title: "Request a Quote",
    text: "Compare offers and choose the best deal.",
  },
  {
    title: "List Your Business",
    text: "Showcase your products and grow your reach.",
  },
  {
    title: "Supplier Verification",
    text: "Build trust with verified business badge.",
  },
];

const topTabs = [
  "Products",
  "Suppliers",
  "Deals",
  "Green Directory",
  "Certifications",
  "Services",
];

const searchTags = [
  "Solar Panels",
  "Lithium Battery",
  "LED High Bay Light",
  "Rainwater Harvesting",
  "Compost Machine",
  "Bamboo Products",
  "Recycled Plastic",
  "Heat Pump",
  "EV Charger",
  "Water Purifier",
];

const trustItems = [
  "Verified Suppliers",
  "Quality Assured Products",
  "Secure Transactions",
  "Timely Delivery",
  "Dedicated Support",
];

const certificationMarks = [
  "ISO 14001",
  "ISO 9001",
  "CE",
  "RoHS",
  "Global Recycled Standard",
];

const staticProducts: ProductCard[] = [
  {
    id: "mono-perc-solar-module",
    title: "Mono PERC Solar Module 550W",
    price: "$0.28",
    unit: "Watt",
    vendor: "SunPeak Energy",
  },
  {
    id: "solar-led-street-light",
    title: "Solar LED Street Light 100W",
    price: "$82.00",
    unit: "Piece",
    vendor: "BrightLite Solutions",
  },
  {
    id: "on-grid-solar-inverter",
    title: "On-Grid Solar Inverter 10kW",
    price: "$680.00",
    unit: "Unit",
    vendor: "VoltEdge Power",
  },
  {
    id: "biogas-plant-25m3",
    title: "Biogas Plant 25m3",
    price: "$4,250.00",
    unit: "Unit",
    vendor: "GreenGas Systems",
  },
];

const staticFeaturedProducts: ProductCard[] = [
  {
    id: "evaporative-air-cooler",
    title: "Evaporative Air Cooler 15000 CMH",
    price: "$320.00",
    unit: "Unit",
    vendor: "CoolBreeze Tech",
  },
  {
    id: "recycled-paper-board",
    title: "Recycled Paper Board 1.5mm",
    price: "$0.68",
    unit: "Sq.ft.",
    vendor: "EcoPulp Industries",
  },
  {
    id: "rainwater-harvesting-tank",
    title: "Rainwater Harvesting Tank 1000 Ltr",
    price: "$95.00",
    unit: "Unit",
    vendor: "AquaSave Solutions",
  },
  {
    id: "ac-ev-charger",
    title: "AC EV Charger 7.4kW Type 2",
    price: "$410.00",
    unit: "Unit",
    vendor: "ChargeGreen",
  },
  {
    id: "organic-waste-composter",
    title: "Organic Waste Composter 200kg/day",
    price: "$1,280.00",
    unit: "Unit",
    vendor: "CompoTech",
  },
  {
    id: "stainless-water-purifier",
    title: "Stainless Steel Water Purifier 25 LPH",
    price: "$210.00",
    unit: "Unit",
    vendor: "PureFlow Systems",
  },
];

const staticSuppliers: SupplierCard[] = [
  { id: "ecovolt", name: "EcoVolt Solutions", country: "India", rating: "4.8", mark: "EV" },
  { id: "greenbuild", name: "GreenBuild Exim", country: "Germany", rating: "4.7", mark: "GB" },
  { id: "purewater", name: "PureWater Tech", country: "India", rating: "4.9", mark: "PW" },
  { id: "sustainpack", name: "SustainPack Ltd.", country: "United Kingdom", rating: "4.6", mark: "SP" },
];

function iconForCategory(icon: string) {
  const commonProps = { size: 16, strokeWidth: 1.75 };

  switch (icon) {
    case "sun":
      return <Zap {...commonProps} />;
    case "drop":
      return <Leaf {...commonProps} />;
    case "recycle":
      return <ShieldCheck {...commonProps} />;
    case "building":
      return <ShoppingBag {...commonProps} />;
    case "hex":
      return <BadgeCheck {...commonProps} />;
    case "box":
      return <ShoppingBag {...commonProps} />;
    case "truck":
      return <ArrowRight {...commonProps} />;
    case "sprout":
      return <Tractor {...commonProps} />;
    case "chart":
      return <CircleHelp {...commonProps} />;
    default:
      return <Zap {...commonProps} />;
  }
}

function productHref(id: string) {
  return `/products/${id}`;
}

export default function HomePage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryItem[]>(sidebarCategories);
  const [bestSellers, setBestSellers] = useState<ProductCard[]>(staticProducts);
  const [featuredProducts, setFeaturedProducts] = useState<ProductCard[]>(staticFeaturedProducts);
  const [featuredSuppliers, setFeaturedSuppliers] = useState<SupplierCard[]>(staticSuppliers);

  useEffect(() => {
    async function loadAuth() {
      try {
        const user = await getCurrentUser();
        const accessToken = getStoredSession()?.accessToken;

        if (!user || !accessToken) {
          setProfile(null);
          return;
        }

        setProfile(await ensureCurrentProfile(accessToken));
      } finally {
        setAuthLoading(false);
      }
    }

    void loadAuth();

    function handleSessionSaved() {
      void loadAuth();
    }

    function handleSessionCleared() {
      setProfile(null);
      setAuthLoading(false);
    }

    window.addEventListener(AUTH_SESSION_SAVED_EVENT, handleSessionSaved);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);

    return () => {
      window.removeEventListener(AUTH_SESSION_SAVED_EVENT, handleSessionSaved);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    };
  }, []);

  useEffect(() => {
    async function loadHomepageData() {
      try {
        const categories = await fetchActiveCategories(10);

        if (categories.length > 0) {
          setCategoryOptions(
            categories.map((item, index) => ({
              id: item.id,
              name: item.name,
              icon: sidebarCategories[index % sidebarCategories.length]?.icon || "sun",
            })),
          );
        }
      } catch {}

      try {
        const products = await fetchApprovedProducts({
          listingType: "Product",
          limit: 6,
        });

        if (products.length > 0) {
          const cards = products.map((product, index) => ({
            id: product.id,
            title: product.title || `Product ${index + 1}`,
            price:
              product.priceType === "Price on Request" || product.price === undefined
                ? "Price on request"
                : `${product.currency} ${product.price.toFixed(2)}`,
            unit: product.moq ? `MOQ ${product.moq}` : "Unit",
            vendor: product.vendorName,
            image: product.images[0]?.startsWith("/") ? product.images[0] : undefined,
          }));

          setBestSellers(cards.slice(0, 4));
          setFeaturedProducts(cards.slice(0, 6));
        }
      } catch {}

      try {
        const vendors = await fetchApprovedVendors(8);

        if (vendors.length > 0) {
          setFeaturedSuppliers(
            vendors.map((vendor, index) => {
              const companyName = vendor.companyName || `Supplier ${index + 1}`;
              return {
                id: vendor.id,
                name: companyName,
                country: vendor.country || vendor.location || "India",
                rating: vendor.isUnclaimed ? "Listed" : "4.8",
                mark: vendor.logoText,
                isUnclaimed: vendor.isUnclaimed,
              };
            }),
          );
        }
      } catch {}
    }

    void loadHomepageData();
  }, []);

  function runSearch() {
    const params = new URLSearchParams();

    if (searchText.trim()) {
      params.set("q", searchText.trim());
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }

    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function handleLogout() {
    await signOutSupabase();
    setProfile(null);
    router.refresh();
  }

  const dashboardLink = profile ? redirectForRole(profile) : "/login";

  return (
    <main className="market-home">
      <div className="market-shell">
        <header className="market-header">
          <div className="utility-bar">
            <div className="utility-spacer" />
            <div className="utility-links">
              <Link href="/buyer/dashboard">Buyer</Link>
              <Link href="/vendor/dashboard">Supplier</Link>
              <Link href="/blogs">Resources</Link>
              <button type="button" className="utility-link globe-link">
                <Globe size={14} />
                EN
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="header-main">
            <Link href="/" className="brand-lockup" aria-label="SustainlyGreen home">
              <Image src="/log.webp" alt="SustainlyGreen" width={270} height={70} priority />
            </Link>

            <div className="search-bar">
              <Search size={18} />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    runSearch();
                  }
                }}
                placeholder="Search eco-friendly products, suppliers, categories..."
              />
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                aria-label="Search category"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button type="button" className="search-button" onClick={runSearch}>
                <Search size={18} />
              </button>
            </div>

            <div className="account-actions">
              {!authLoading && profile ? (
                <>
                  <span className="sign-in-link account-user">
                    <UserRound size={18} />
                    Hi, {profile.name || "User"}
                  </span>
                  <Link href={dashboardLink} className="join-button">
                    Dashboard
                  </Link>
                  <button type="button" className="sign-in-link" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="sign-in-link">
                    <UserRound size={18} />
                    Sign In
                  </Link>
                  <Link href="/register?role=BUYER" className="join-button">
                    Join Free
                  </Link>
                </>
              )}
              <button
                type="button"
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen((value) => !value)}
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className={`menu-row ${mobileMenuOpen ? "menu-row-open" : ""}`}>
            <button type="button" className="menu-categories-button">
              <Menu size={16} />
              Categories
            </button>
            <nav className="menu-tabs" aria-label="Primary">
              {topTabs.map((tab) => (
                <Link
                  key={tab}
                  href={tab === "Suppliers" ? "/browse?type=vendor" : "/browse"}
                  className="menu-tab"
                >
                  {tab}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="hero-composition">
          <aside className="sidebar-card">
            <div className="sidebar-list">
              {categoryOptions.map((category) => (
                <Link key={category.id} href={`/browse?category=${category.id}`} className="sidebar-link">
                  <span className="sidebar-icon">{iconForCategory(category.icon)}</span>
                  <span className="sidebar-label">{category.name}</span>
                </Link>
              ))}
              <Link href="/categories" className="sidebar-link all-link">
                <span className="sidebar-icon">{iconForCategory("sun")}</span>
                <span className="sidebar-label">All Categories</span>
                <span className="sidebar-arrow">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>

            <div className="sidebar-cta">
              <p className="sidebar-cta-label">New to SustainlyGreen?</p>
              <p>Join our network of sustainable businesses worldwide.</p>
              <Link href="/register?role=VENDOR" className="sidebar-cta-button">
                Join Free
              </Link>
            </div>
          </aside>

          <div className="hero-stack">
            <div className="hero-banner">
              <div className="hero-copy">
                <p className="hero-kicker">Powering a</p>
                <h1>Sustainable Future</h1>
                <p className="hero-text">
                  Discover verified eco-friendly products and connect with trusted green suppliers.
                </p>
                <div className="hero-buttons">
                  <Link href="/browse" className="primary-hero-button">
                    Explore Products
                  </Link>
                  <Link href="/browse?type=vendor" className="secondary-hero-button">
                    Find Suppliers
                  </Link>
                </div>
              </div>

              <div className="hero-visual" aria-hidden="true">
                <div className="hero-arc" />
                <div className="hero-leaf hero-leaf-top" />
                <div className="hero-leaf hero-leaf-side" />
                <div className="hero-windmill" />
                <div className="hero-energy-unit">
                  <div className="hero-energy-label">ENERGY STORAGE</div>
                </div>
                <div className="hero-solar-row">
                  <div className="hero-solar-panel" />
                  <div className="hero-solar-panel panel-tilt" />
                </div>
              </div>
            </div>

          </div>

          <aside className="ad-card">
            <div className="ad-badge">
              <Leaf size={22} />
            </div>
            <h3>Advertise Here</h3>
            <p>Reach 50k+ buyers every month</p>
            <Link href="/contact" className="ad-button">
              Learn More
            </Link>
            <div className="ad-dots">
              <span className="ad-dot ad-dot-active" />
              <span className="ad-dot" />
              <span className="ad-dot" />
            </div>
          </aside>

          <div className="quick-action-grid">
            {quickActions.map((item) => (
              <Link
                key={item.title}
                href={item.title === "List Your Business" ? "/register?role=VENDOR" : "/browse"}
                className={`quick-action-card${item.title === "Supplier Verification" ? " verification-card" : ""}`}
              >
                <div className="quick-action-icon">
                  <BadgeCheck size={20} />
                </div>
                <div className="quick-action-copy">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-head">
            <h2>Shop by Category</h2>
            <Link href="/categories">View all categories</Link>
          </div>
          <div className="category-strip">
            {categoryOptions.map((category) => (
              <Link key={category.id} href={`/browse?category=${category.id}`} className="category-pill-card">
                <span className="category-pill-icon">{iconForCategory(category.icon)}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="split-section">
          <div className="split-panel">
            <div className="section-head">
              <h2>Best Sellers</h2>
              <Link href="/browse">View all</Link>
            </div>
            <div className="card-grid four-up">
              {bestSellers.map((product, index) => (
                <Link key={product.id} href={productHref(product.id)} className="product-card">
                  <div className={`product-media media-${index % 4}`}>
                    {product.image ? (
                      <Image src={product.image} alt={product.title} width={140} height={140} />
                    ) : (
                      <div className="product-placeholder" />
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.title}</h3>
                    <p className="product-price">
                      {product.price} <span>/ {product.unit}</span>
                    </p>
                    <p className="product-vendor">By: {product.vendor}</p>
                    <p className="verified-label">Verified Supplier</p>
                  </div>
                </Link>
              ))}
            </div>
            <button type="button" className="carousel-arrow carousel-arrow-left" aria-label="Previous best sellers">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="carousel-arrow carousel-arrow-right" aria-label="Next best sellers">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="split-panel">
            <div className="section-head">
              <h2>Listed Green Vendors</h2>
              <Link href="/browse?type=vendor">View all</Link>
            </div>
            <div className="card-grid four-up">
              {featuredSuppliers.map((supplier, index) => (
                <Link key={supplier.id} href={`/find-vendors/${supplier.id}`} className="supplier-card">
                  <div className={`supplier-mark mark-${index % 4}`}>{supplier.mark}</div>
                  <h3>{supplier.name}</h3>
                  <p className="supplier-country">{supplier.country}</p>
                  <p className="verified-label">
                    {supplier.isUnclaimed ? "Listed Supplier" : "Verified Supplier"}
                  </p>
                  <div className="supplier-rating">
                    <span>{supplier.rating}</span>
                    {!supplier.isUnclaimed && <span className="stars">★★★★★</span>}
                  </div>
                </Link>
              ))}
            </div>
            <button type="button" className="carousel-arrow carousel-arrow-right" aria-label="Next suppliers">
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section className="section-block compact-gap">
          <div className="section-head left-heavy">
            <h2>Popular Searches</h2>
          </div>
          <div className="tag-row">
            {searchTags.map((tag) => (
              <Link key={tag} href={`/browse?q=${encodeURIComponent(tag)}`} className="tag-chip">
                <Search size={13} />
                {tag}
              </Link>
            ))}
          </div>
        </section>

        <section className="trust-band">
          <div className="trust-head">
            <h2>Trusted, Verified &amp; Certified</h2>
          </div>
          <div className="trust-points">
            {trustItems.map((item) => (
              <div key={item} className="trust-point">
                <ShieldCheck size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="trust-certifications">
            <p>Our Certifications</p>
            <div className="certification-list">
              {certificationMarks.map((item) => (
                <span key={item} className="certification-badge">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block featured-products-section">
          <div className="section-head">
            <h2>Featured Products</h2>
            <Link href="/browse">View all products</Link>
          </div>
          <div className="card-grid six-up">
            {featuredProducts.map((product, index) => (
              <Link key={product.id} href={productHref(product.id)} className="product-card compact-product-card">
                <div className={`product-media media-${index % 4}`}>
                  {product.image ? (
                    <Image src={product.image} alt={product.title} width={130} height={130} />
                  ) : (
                    <div className="product-placeholder" />
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <p className="product-price">
                    {product.price} <span>/ {product.unit}</span>
                  </p>
                  <p className="product-vendor">By: {product.vendor}</p>
                  <p className="verified-label">Verified Supplier</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Footer />

      <style>{`
        .market-home {
          background: #fcfdfb;
          color: #10241b;
          width: 100%;
        }

        .market-shell {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0 0 48px;
        }

        .market-header {
          background: #fff;
          border-bottom: 1px solid #e4ece6;
          border-left: 0;
          border-right: 0;
          border-top: 0;
          border-radius: 0;
          box-shadow: 0 10px 24px rgba(17, 48, 33, 0.04);
          padding: 14px 24px 0;
          margin-bottom: 18px;
        }

        .utility-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #466354;
          margin-bottom: 12px;
        }

        .utility-links {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-left: auto;
        }

        .utility-links a,
        .utility-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #466354;
          background: transparent;
          font-size: 13px;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition:
            color 170ms ease,
            background-color 170ms ease,
            box-shadow 170ms ease,
            transform 170ms ease;
        }

        .utility-links a:hover,
        .utility-link:hover {
          color: #fff;
          background: #287e40;
          box-shadow: 0 6px 14px rgba(31, 111, 53, 0.18);
          transform: translateY(-2px);
        }

        .utility-links a:active,
        .utility-link:active {
          transform: translateY(0) scale(0.97);
        }

        .utility-links a:focus-visible,
        .utility-link:focus-visible {
          outline: 3px solid rgba(45, 135, 70, 0.28);
          outline-offset: 2px;
        }

        .header-main {
          display: grid;
          grid-template-columns: auto minmax(320px, 1fr) auto;
          align-items: center;
          gap: 22px;
          padding-bottom: 14px;
        }

        .brand-lockup img {
          height: auto;
          width: 230px;
        }

        .search-bar {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          border: 1px solid #d8e4dc;
          border-radius: 14px;
          overflow: hidden;
          min-height: 48px;
          background: #fff;
        }

        .search-bar svg {
          margin-left: 16px;
          color: #6e8578;
        }

        .search-bar input,
        .search-bar select {
          border: 0;
          background: transparent;
          outline: 0;
          font: inherit;
          color: #1a3427;
          min-width: 0;
        }

        .search-bar input {
          padding: 0 14px;
        }

        .search-bar select {
          border-left: 1px solid #e1e8e3;
          padding: 0 16px;
          min-height: 48px;
          color: #2e4a3b;
        }

        .search-button {
          min-width: 52px;
          min-height: 48px;
          background: linear-gradient(180deg, #2e8f45, #206f35);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .search-button svg {
          margin-left: 0;
          color: currentColor;
        }

        .search-button:hover {
          filter: brightness(0.9);
          box-shadow: 0 6px 14px rgba(31, 111, 53, 0.24);
        }

        .account-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sign-in-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          color: #183426;
          font-weight: 500;
        }

        .join-button {
          border: 1px solid #abc0b1;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 600;
          color: #204230;
          background: #fff;
        }

        .sign-in-link,
        .join-button,
        .primary-hero-button,
        .secondary-hero-button,
        .sidebar-cta-button,
        .ad-button,
        .search-button {
          cursor: pointer;
          transition:
            color 170ms ease,
            background-color 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease,
            transform 170ms ease,
            filter 170ms ease;
        }

        .sign-in-link:hover {
          color: #176d35;
          background: #eef7f0;
          transform: translateY(-1px);
        }

        .join-button:hover {
          color: #fff;
          background: #247d3c;
          border-color: #247d3c;
          box-shadow: 0 8px 18px rgba(31, 111, 53, 0.2);
          transform: translateY(-2px);
        }

        .sign-in-link:focus-visible,
        .join-button:focus-visible,
        .primary-hero-button:focus-visible,
        .secondary-hero-button:focus-visible,
        .sidebar-cta-button:focus-visible,
        .ad-button:focus-visible,
        .search-button:focus-visible {
          outline: 3px solid rgba(45, 135, 70, 0.28);
          outline-offset: 3px;
        }

        .sign-in-link:active,
        .join-button:active,
        .primary-hero-button:active,
        .secondary-hero-button:active,
        .sidebar-cta-button:active,
        .ad-button:active,
        .search-button:active {
          transform: translateY(0) scale(0.98);
        }

        .mobile-menu-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eef5f0;
          color: #173326;
        }

        .menu-row {
          display: flex;
          align-items: stretch;
          gap: 0;
          border-top: 1px solid #edf2ee;
          border-bottom: 1px solid #e5ede7;
          padding: 8px 0 0;
        }

        .menu-categories-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 52px;
          padding: 0 18px;
          border-radius: 0;
          background: #f0f6f1;
          border: 1px solid #e0ebe3;
          font-weight: 600;
          color: #173326;
          width: 250px;
          min-width: 250px;
          font-size: 14px;
          line-height: 1;
          justify-content: flex-start;
        }

        .menu-tabs {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-wrap: wrap;
          min-height: 52px;
          padding-left: 14px;
        }

        .menu-tab {
          position: relative;
          display: inline-flex;
          align-items: center;
          height: 52px;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.01em;
          color: #244536;
          border-radius: 0;
          transition: color 160ms ease, background-color 160ms ease;
        }

        .menu-tab:hover {
          color: #176d35;
          background: #f5f9f6;
        }

        .menu-tab::after {
          content: "";
          position: absolute;
          right: 14px;
          bottom: 0;
          left: 14px;
          height: 2px;
          background: #2d8746;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 160ms ease;
        }

        .menu-tab:hover::after,
        .menu-tab:focus-visible::after {
          transform: scaleX(1);
        }

        .hero-composition {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr) 190px;
          grid-template-rows: auto 112px;
          column-gap: 16px;
          row-gap: 14px;
          align-items: start;
          padding: 0 24px;
          margin-top: 0;
        }

        .sidebar-card,
        .ad-card,
        .hero-banner,
        .quick-action-card,
        .category-pill-card,
        .product-card,
        .supplier-card,
        .trust-band,
        .split-panel {
          background: #fff;
          border: 1px solid #e5ede7;
          box-shadow: 0 10px 24px rgba(18, 46, 32, 0.05);
        }

        .sidebar-card {
          border-radius: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          margin-top: 0;
          box-shadow: none;
          align-self: stretch;
          grid-column: 1;
          grid-row: 1 / 3;
          height: auto;
        }

        .sidebar-list {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          justify-content: space-evenly;
          gap: 2px;
          min-height: 0;
          padding: 8px 0;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 20px;
          min-height: 0;
          flex: 1 1 0;
          font-size: 13px;
          line-height: 1.35;
          color: #274839;
          border-bottom: 0;
          cursor: pointer;
          transition:
            color 170ms ease,
            background-color 170ms ease,
            box-shadow 170ms ease,
            transform 170ms ease;
        }

        .sidebar-link:hover {
          color: #176d35;
          background: #edf7ef;
          box-shadow: inset 3px 0 0 #2b7a40;
          transform: translateX(3px);
        }

        .sidebar-link:hover .sidebar-icon {
          color: #1f7b3a;
          transform: translateY(1px) scale(1.12);
        }

        .sidebar-link:active {
          background: #e4f1e7;
          transform: translateX(1px) scale(0.99);
        }

        .sidebar-link:focus-visible {
          outline: 3px solid rgba(45, 135, 70, 0.28);
          outline-offset: -3px;
        }

        .all-link {
          font-weight: 600;
        }

        .sidebar-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          margin-left: auto;
        }

        .sidebar-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 18px;
          color: #537464;
          width: 18px;
          height: 18px;
          transform: translateY(1px);
          transition: color 170ms ease, transform 170ms ease;
        }

        .sidebar-icon svg {
          display: block;
          width: 14px;
          height: 14px;
          stroke-width: 1.6;
        }

        .sidebar-label {
          display: inline-flex;
          align-items: center;
          min-height: 18px;
          line-height: 1.15;
        }

        .sidebar-cta {
          background: linear-gradient(180deg, #eef6ef, #f7fbf8);
          padding: 14px 18px;
          border-top: 1px solid #e3ece5;
          display: grid;
          gap: 10px;
          color: #355545;
          font-size: 13px;
          line-height: 1.45;
          min-height: 136px;
          flex: 0 0 136px;
          align-content: start;
        }

        .sidebar-cta-label {
          font-weight: 700;
          color: #173326;
          font-size: 13px;
        }

        .sidebar-cta .sidebar-cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 145px;
          max-width: 100%;
          min-height: 36px;
          margin-top: 6px;
          padding: 8px 18px;
          border-radius: 6px;
          background: linear-gradient(180deg, #2a8a43, #1f6f35);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }

        .sidebar-cta .sidebar-cta-button:hover {
          filter: brightness(0.9);
          box-shadow: 0 8px 16px rgba(31, 111, 53, 0.24);
          transform: translateY(-2px);
        }

        .hero-stack {
          display: block;
          grid-column: 2;
          grid-row: 1;
          height: auto;
          margin-top: 16px;
        }

        .hero-banner {
          border-radius: 22px;
          padding: 28px 30px 22px;
          background: linear-gradient(135deg, #f5fbf6 0%, #edf7ef 45%, #f8fcf9 100%);
          display: grid;
          grid-template-columns: minmax(300px, 420px) minmax(260px, 1fr);
          gap: 14px;
          overflow: hidden;
          min-height: 300px;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .hero-kicker {
          font-size: 15px;
          font-weight: 700;
          color: #2d7e43;
          margin: 0;
        }

        .hero-copy h1 {
          font-size: clamp(2.9rem, 4vw, 4.2rem);
          line-height: 1.02;
          letter-spacing: -0.04em;
          margin: 0;
        }

        .hero-text {
          max-width: 390px;
          color: #456353;
          font-size: 16px;
          line-height: 1.45;
          margin: 0;
        }

        .hero-buttons {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 8px;
        }

        .primary-hero-button,
        .secondary-hero-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 154px;
          min-height: 46px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
        }

        .primary-hero-button {
          background: linear-gradient(180deg, #31984c, #206f35);
          color: #fff;
        }

        .secondary-hero-button {
          border: 1px solid #adc2b2;
          color: #1f3b2d;
          background: rgba(255, 255, 255, 0.75);
        }

        .primary-hero-button:hover {
          filter: brightness(0.9);
          box-shadow: 0 10px 20px rgba(31, 111, 53, 0.24);
          transform: translateY(-2px);
        }

        .secondary-hero-button:hover {
          color: #fff;
          background: #247d3c;
          border-color: #247d3c;
          box-shadow: 0 10px 20px rgba(31, 111, 53, 0.18);
          transform: translateY(-2px);
        }

        .hero-visual {
          position: relative;
          min-height: 220px;
        }

        .hero-arc {
          position: absolute;
          inset: 8px 42px 42px 54px;
          border: 10px solid #48b159;
          border-right-color: transparent;
          border-bottom-color: transparent;
          border-radius: 999px;
          transform: rotate(11deg);
          opacity: 0.9;
        }

        .hero-leaf {
          position: absolute;
          width: 28px;
          height: 18px;
          border-radius: 50% 0 50% 50%;
          background: linear-gradient(135deg, #66c25f, #2b9542);
          transform: rotate(-24deg);
        }

        .hero-leaf-top {
          top: 28px;
          right: 58px;
        }

        .hero-leaf-side {
          top: 102px;
          left: 34px;
        }

        .hero-windmill {
          position: absolute;
          top: 12px;
          left: 102px;
          width: 2px;
          height: 108px;
          background: #b4beb7;
        }

        .hero-windmill::before,
        .hero-windmill::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 12px;
          width: 1px;
          height: 50px;
          background: #b4beb7;
          transform-origin: bottom center;
        }

        .hero-windmill::before {
          transform: translateX(-50%) rotate(54deg);
        }

        .hero-windmill::after {
          transform: translateX(-50%) rotate(-54deg);
        }

        .hero-energy-unit {
          position: absolute;
          right: 34px;
          bottom: 18px;
          width: 190px;
          height: 142px;
          border-radius: 16px;
          background: linear-gradient(145deg, #ffffff, #edf3ef);
          border: 1px solid #d7e3da;
          box-shadow: 0 18px 34px rgba(39, 69, 50, 0.12);
        }

        .hero-energy-unit::before {
          content: "";
          position: absolute;
          inset: 0 0 0 auto;
          width: 8px;
          border-radius: 0 16px 16px 0;
          background: linear-gradient(180deg, #27863f, #19642c);
        }

        .hero-energy-label {
          position: absolute;
          top: 32px;
          left: 28px;
          max-width: 72px;
          font-size: 14px;
          line-height: 1.15;
          letter-spacing: 0.08em;
          color: #233c2f;
        }

        .hero-solar-row {
          position: absolute;
          left: 56px;
          bottom: 12px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .hero-solar-panel {
          width: 112px;
          height: 84px;
          border-radius: 10px;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px),
            linear-gradient(180deg, #304f79, #15243d);
          background-size: 18px 18px, 18px 18px, 100% 100%;
          transform: skew(-14deg);
          box-shadow: 0 16px 26px rgba(14, 34, 54, 0.22);
        }

        .panel-tilt {
          width: 138px;
          height: 92px;
          transform: skew(-14deg) translateY(2px);
        }

        .ad-card {
          grid-column: 3;
          grid-row: 1;
          border-radius: 22px;
          padding: 28px 16px 22px;
          display: grid;
          gap: 14px;
          justify-items: center;
          text-align: center;
          background: linear-gradient(180deg, #f3faf5, #fdfefe);
          height: 300px;
          min-height: 0;
          align-content: center;
          margin-top: 16px;
        }

        .ad-badge {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          background: #f0f6f1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #2b7440;
        }

        .ad-card h3,
        .quick-action-copy h3,
        .product-info h3,
        .supplier-card h3,
        .section-head h2,
        .trust-head h2 {
          margin: 0;
        }

        .ad-card p,
        .quick-action-copy p,
        .product-vendor,
        .supplier-country {
          margin: 0;
          color: #536e61;
        }

        .ad-card h3 {
          font-size: 16px;
        }

        .ad-card p {
          font-size: 13px;
          line-height: 1.45;
          max-width: 130px;
        }

        .ad-button {
          border: 1px solid #b4c6ba;
          border-radius: 10px;
          padding: 10px 16px;
          font-weight: 600;
          color: #173326;
          background: #fff;
        }

        .ad-button:hover {
          color: #fff;
          background: #247d3c;
          border-color: #247d3c;
          box-shadow: 0 8px 16px rgba(31, 111, 53, 0.18);
          transform: translateY(-2px);
        }

        .ad-dots {
          display: flex;
          gap: 8px;
        }

        .ad-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #ccd9d0;
        }

        .ad-dot-active {
          background: #2b7a40;
        }

        .quick-action-grid {
          display: grid;
          grid-column: 2 / 4;
          grid-row: 2;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .quick-action-card {
          border-radius: 16px;
          padding: 15px 18px;
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr) 16px;
          gap: 14px;
          align-items: center;
          min-height: 112px;
          border: 1px solid #e5ede7;
          box-shadow: 0 10px 24px rgba(18, 46, 32, 0.055);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .quick-action-card:hover {
          transform: translateY(-3px);
          border-color: #cddfd2;
          box-shadow: 0 16px 30px rgba(18, 46, 32, 0.09);
        }

        .verification-card {
          background: linear-gradient(180deg, #eef7ef, #fbfdfb);
        }

        .quick-action-icon {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: #eff6f0;
          color: #2c7340;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .quick-action-copy p {
          font-size: 13px;
          line-height: 1.4;
          margin-top: 5px;
          max-width: 220px;
        }

        .quick-action-copy h3 {
          font-size: 15px;
          line-height: 1.2;
        }

        .quick-action-card svg:last-child {
          grid-column: auto;
          justify-self: end;
          color: #28483a;
          margin-top: 0;
        }

        .section-block {
          margin-top: 28px;
          padding: 0 24px;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .section-head h2 {
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .section-head a {
          color: #2b7a40;
          font-weight: 600;
          font-size: 14px;
        }

        .category-strip {
          display: grid;
          grid-template-columns: repeat(10, minmax(0, 1fr));
          gap: 10px;
        }

        .category-pill-card {
          border-radius: 16px;
          padding: 16px 10px 14px;
          text-align: center;
          display: grid;
          gap: 8px;
          justify-items: center;
          min-height: 100px;
          border: 1px solid #e5ede7;
          box-shadow: 0 4px 12px rgba(18, 46, 32, 0.03);
          cursor: pointer;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease,
            color 180ms ease;
        }

        .category-pill-card:hover {
          color: #176d35;
          background: #f5faf6;
          border-color: #b9d5c0;
          box-shadow: 0 12px 24px rgba(31, 111, 53, 0.11);
          transform: translateY(-4px);
        }

        .category-pill-card:active {
          transform: translateY(-1px) scale(0.98);
        }

        .category-pill-card:focus-visible {
          outline: 3px solid rgba(45, 135, 70, 0.28);
          outline-offset: 3px;
        }

        .category-pill-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: #f1f6f2;
          color: #2b7440;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 180ms ease, background-color 180ms ease, transform 180ms ease;
        }

        .category-pill-card:hover .category-pill-icon {
          color: #fff;
          background: #2b7a40;
          transform: scale(1.08);
        }

        .category-pill-card span:last-child {
          font-size: 13px;
          font-weight: 500;
          line-height: 1.25;
        }

        .split-section {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 22px;
          padding: 0 24px;
        }

        .split-panel {
          border-radius: 14px;
          padding: 14px;
          position: relative;
        }

        .split-section .section-head h2 {
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .split-section .section-head a {
          font-size: 12px;
        }

        .card-grid {
          display: grid;
          grid-auto-rows: 1fr;
          gap: 10px;
        }

        .four-up {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .six-up {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }

        .product-card,
        .supplier-card {
          border-radius: 8px;
          overflow: hidden;
        }

        .split-section .product-card,
        .split-section .supplier-card {
          height: 260px;
          min-height: 260px;
          cursor: pointer;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .split-section .product-card:hover,
        .split-section .supplier-card:hover {
          border-color: #b9d5c0;
          box-shadow: 0 16px 30px rgba(31, 111, 53, 0.11);
          transform: translateY(-5px);
        }

        .split-section .product-card:active,
        .split-section .supplier-card:active {
          transform: translateY(-1px) scale(0.99);
        }

        .split-section .product-card:focus-visible,
        .split-section .supplier-card:focus-visible {
          outline: 3px solid rgba(45, 135, 70, 0.28);
          outline-offset: 3px;
        }

        .product-card {
          padding: 10px;
        }

        .split-section .product-card {
          display: flex;
          flex-direction: column;
        }

        .split-section .product-media {
          min-height: 105px;
          margin-bottom: 8px;
          border-radius: 8px;
        }

        .split-section .product-media img {
          max-height: 96px;
        }

        .split-section .product-placeholder {
          width: 62px;
          height: 78px;
          border-radius: 10px;
        }

        .product-media {
          border-radius: 16px;
          min-height: 160px;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          overflow: hidden;
          transition: background-color 180ms ease, transform 180ms ease;
        }

        .split-section .product-card:hover .product-media {
          transform: scale(1.02);
        }

        .media-0 {
          background: linear-gradient(180deg, #f6f7f6, #eef2ef);
        }

        .media-1 {
          background: linear-gradient(180deg, #f8faf8, #ecefea);
        }

        .media-2 {
          background: linear-gradient(180deg, #f5f7f8, #edf2f2);
        }

        .media-3 {
          background: linear-gradient(180deg, #f8faf5, #edf4ed);
        }

        .product-media img {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 146px;
          object-fit: contain;
        }

        .product-placeholder {
          width: 86px;
          height: 104px;
          border-radius: 18px;
          background: linear-gradient(180deg, #313d42, #97ab9f);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
        }

        .product-info h3 {
          font-size: 16px;
          line-height: 1.32;
          margin-bottom: 8px;
        }

        .split-section .product-info h3 {
          min-height: 36px;
          margin-bottom: 5px;
          font-size: 13px;
          line-height: 1.22;
        }

        .split-section .product-price {
          margin-bottom: 3px;
          font-size: 14px;
        }

        .split-section .product-price span,
        .split-section .product-vendor,
        .split-section .verified-label {
          font-size: 12px;
        }

        .split-section .product-info {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-height: 0;
        }

        .product-price {
          font-size: 18px;
          font-weight: 700;
          color: #173326;
          margin: 0 0 4px;
        }

        .product-price span,
        .verified-label {
          color: #60796b;
          font-size: 13px;
          font-weight: 500;
        }

        .verified-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
        }

        .split-section .product-info .verified-label {
          margin-top: auto;
        }

        .verified-label::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22833e;
        }

        .supplier-card {
          padding: 12px;
          display: grid;
          grid-template-rows: 56px minmax(34px, auto) 18px 1fr auto;
          align-items: start;
          justify-items: center;
          text-align: center;
          gap: 8px;
        }

        .supplier-mark {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.05em;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .split-section .supplier-card:hover .supplier-mark {
          transform: scale(1.08);
          box-shadow: 0 10px 20px rgba(31, 111, 53, 0.12);
        }

        .mark-0 {
          background: #edf6ef;
          color: #2f8746;
        }

        .mark-1 {
          background: #eef5f1;
          color: #2f7f4f;
        }

        .mark-2 {
          background: #edf4fb;
          color: #2c74b3;
        }

        .mark-3 {
          background: #faf1e8;
          color: #c07935;
        }

        .supplier-country {
          font-size: 12px;
        }

        .split-section .supplier-card h3 {
          font-size: 13px;
          line-height: 1.2;
        }

        .split-section .supplier-card .verified-label {
          font-size: 12px;
        }

        .supplier-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: #173326;
          margin-top: 4px;
          align-self: end;
          font-size: 12px;
        }

        .stars {
          font-size: 12px;
          color: #2e7f43;
          letter-spacing: 0.08em;
        }

        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #dfebe3;
          box-shadow: 0 8px 18px rgba(17, 46, 31, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #28483a;
        }

        .carousel-arrow-left {
          left: -12px;
        }

        .carousel-arrow-right {
          right: -12px;
        }

        .compact-gap {
          margin-top: 16px;
        }

        .left-heavy {
          justify-content: flex-start;
        }

        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid #deebe2;
          border-radius: 999px;
          background: #fff;
          color: #264738;
          font-size: 13px;
          cursor: pointer;
          transition:
            color 170ms ease,
            background-color 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease,
            transform 170ms ease;
        }

        .tag-chip:hover {
          color: #fff;
          background: #287e40;
          border-color: #287e40;
          box-shadow: 0 8px 18px rgba(31, 111, 53, 0.18);
          transform: translateY(-3px);
        }

        .tag-chip:active {
          transform: translateY(0) scale(0.98);
        }

        .tag-chip:focus-visible {
          outline: 3px solid rgba(45, 135, 70, 0.28);
          outline-offset: 3px;
        }

        .trust-band {
          margin-top: 24px;
          margin-left: 24px;
          margin-right: 24px;
          border-radius: 24px;
          padding: 24px 28px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 28px;
          align-items: center;
          background: linear-gradient(90deg, #eef8ef 0%, #f9fcf9 50%, #eff7f2 100%);
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .trust-band:hover {
          border-color: #c5dccb;
          box-shadow: 0 14px 28px rgba(31, 111, 53, 0.09);
          transform: translateY(-2px);
        }

        .trust-points {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          justify-content: center;
        }

        .trust-point {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #2a493b;
          font-size: 14px;
          font-weight: 500;
          transition: color 170ms ease, transform 170ms ease;
        }

        .trust-point:hover {
          color: #1f7b3a;
          transform: translateY(-2px);
        }

        .trust-point svg {
          transition: transform 170ms ease;
        }

        .trust-point:hover svg {
          transform: scale(1.14);
        }

        .trust-certifications p {
          margin: 0 0 10px;
          font-size: 13px;
          color: #5c7568;
          text-align: right;
        }

        .certification-list {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .certification-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
          padding: 10px 12px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #d8e5dc;
          font-size: 13px;
          font-weight: 700;
          color: #1d3a2c;
          transition:
            color 170ms ease,
            background-color 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease,
            transform 170ms ease;
        }

        .certification-badge:hover {
          color: #176d35;
          background: #f1f8f3;
          border-color: #b9d5c0;
          box-shadow: 0 7px 15px rgba(31, 111, 53, 0.1);
          transform: translateY(-2px);
        }

        .featured-products-section {
          margin-top: 28px;
          margin-bottom: 24px;
        }

        .featured-products-section .section-head a {
          transition: color 170ms ease, transform 170ms ease;
        }

        .featured-products-section .section-head a:hover {
          color: #176d35;
          text-decoration: underline;
          text-underline-offset: 4px;
          transform: translateX(-3px);
        }

        .featured-products-section .product-card {
          cursor: pointer;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .featured-products-section .product-card:hover {
          border-color: #b9d5c0;
          box-shadow: 0 16px 30px rgba(31, 111, 53, 0.11);
          transform: translateY(-5px);
        }

        .featured-products-section .product-card:active {
          transform: translateY(-1px) scale(0.99);
        }

        .featured-products-section .product-card:focus-visible {
          outline: 3px solid rgba(45, 135, 70, 0.28);
          outline-offset: 3px;
        }

        .featured-products-section .product-card:hover .product-media {
          transform: scale(1.02);
        }

        .compact-product-card .product-media {
          min-height: 134px;
        }

        .compact-product-card .product-info h3 {
          font-size: 15px;
        }

        @media (max-width: 1220px) {
          .menu-categories-button {
            width: 220px;
            min-width: 220px;
          }

          .hero-composition {
            grid-template-columns: 220px minmax(0, 1fr);
            grid-template-rows: auto;
          }

          .ad-card {
            grid-column: 2;
            grid-row: 3;
            height: auto;
            min-height: auto;
            margin-top: 4px;
          }

          .quick-action-grid {
            grid-column: 2;
            grid-row: 2;
          }

          .category-strip {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }

          .four-up {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .six-up {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .trust-band {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .trust-points,
          .certification-list {
            justify-content: flex-start;
          }

          .trust-certifications p {
            text-align: left;
          }
        }

        @media (max-width: 980px) {
          .market-shell {
            padding: 0 0 40px;
          }

          .header-main {
            grid-template-columns: 1fr;
          }

          .account-actions {
            justify-content: space-between;
          }

          .mobile-menu-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .menu-row {
            display: none;
          }

          .menu-row-open {
            display: grid;
            justify-items: start;
          }

          .menu-tabs {
            display: grid;
            gap: 2px;
          }

          .hero-composition {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            padding: 0 14px;
            margin-top: 14px;
          }

          .sidebar-card,
          .ad-card {
            grid-column: auto;
            grid-row: auto;
            order: 2;
          }

          .sidebar-card {
            height: auto;
            margin-top: 0;
          }

          .hero-stack {
            order: 1;
            grid-column: auto;
            grid-row: auto;
            height: auto;
          }

          .quick-action-grid {
            grid-column: auto;
            grid-row: auto;
            order: 1;
          }

          .hero-banner {
            grid-template-columns: 1fr;
            padding: 24px 20px 18px;
          }

          .hero-visual {
            min-height: 240px;
          }

          .quick-action-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .split-section {
            grid-template-columns: 1fr;
            padding: 0 14px;
          }

          .section-block {
            padding: 0 14px;
          }

          .trust-band {
            margin-left: 14px;
            margin-right: 14px;
          }
        }

        @media (max-width: 720px) {
          .market-header {
            padding: 14px 14px 0;
          }

          .utility-bar {
            display: none;
          }

          .brand-lockup img {
            width: 190px;
          }

          .search-bar {
            grid-template-columns: auto minmax(0, 1fr) auto;
          }

          .search-bar select {
            display: none;
          }

          .account-actions {
            gap: 10px;
          }

          .join-button,
          .sign-in-link {
            font-size: 13px;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .quick-action-grid,
          .category-strip,
          .four-up,
          .six-up {
            grid-template-columns: 1fr;
          }

          .sidebar-link {
            padding: 0 16px;
            min-height: 34px;
            font-size: 11px;
          }

          .sidebar-cta {
            padding: 20px 16px;
            font-size: 14px;
            min-height: auto;
          }

          .quick-action-card {
            min-height: auto;
          }

          .section-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .section-head h2 {
            font-size: 24px;
          }

          .carousel-arrow {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
