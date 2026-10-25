"use client";

import Link from "next/link";
import Image from "next/image";
import { productHref, vendorHref } from "@/lib/slug";
import {
  Bell,
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  Package,
  Building2,
  Layers,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_SESSION_SAVED_EVENT,
  ensureCurrentProfile,
  getCurrentUser,
  getStoredSession,
  signOutSupabase,
  type SupabaseProfile,
} from "@/lib/supabaseAuth";
import {
  fetchActiveCategories,
  searchSuggestions,
} from "@/lib/supabasePublic";

type Suggestion = {
  id: string;
  slug?: string;
  title: string;
  type: "product" | "vendor" | "category";
};

export default function Header() {
  const router = useRouter();

  /* UI */
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openAccount, setOpenAccount] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  /* AUTH */
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  /* SEARCH */
  const [queryText, setQueryText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  /* MASTER DATA */
  const [categories, setCategories] = useState<Suggestion[]>([]);
  const [openMobileCategories, setOpenMobileCategories] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const mobileCatRef = useRef<HTMLDivElement>(null);

  /* ---------------- SCROLL HIDE ---------------- */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      if (y > lastScrollY && y > 100) setShow(false);
      else setShow(true);

      setScrolled(y > 20); // 👈 ADD THIS
      setLastScrollY(y);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    async function loadAuth() {
      setLoadingUser(true);
      const user = await getCurrentUser();

      if (!user) {
        setAuthUser(null);
        setProfile(null);
        setLoadingUser(false);
        return;
      }

      setAuthUser({ id: user.id, email: user.email });
      const accessToken = getStoredSession()?.accessToken;
      setProfile(accessToken ? await ensureCurrentProfile(accessToken) : null);
      setLoadingUser(false);
    }

    void loadAuth();

    function clearAuth() {
      setAuthUser(null);
      setProfile(null);
      setLoadingUser(false);
    }

    window.addEventListener(AUTH_SESSION_SAVED_EVENT, loadAuth);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, clearAuth);

    return () => {
      window.removeEventListener(AUTH_SESSION_SAVED_EVENT, loadAuth);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, clearAuth);
    };
  }, []);

  /* ---------------- LOAD CATEGORIES (ONCE) ---------------- */
  useEffect(() => {
    fetchActiveCategories()
      .then((publicCategories) =>
        setCategories(
          publicCategories.map((category) => ({
            id: category.id,
            title: category.name,
            type: "category",
          })),
        ),
      )
      .catch(() => {});
  }, []);

  /* ---------------- FILTER SUGGESTIONS ---------------- */
  // Products and vendors are looked up in the database as you type, rather
  // than downloading every vendor on every page load.
  useEffect(() => {
    const text = queryText.trim();
    if (!text) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    let cancelled = false;
    const q = text.toLowerCase();
    const categoryMatches = categories
      .filter((c) => c.title.toLowerCase().includes(q))
      .slice(0, 2);

    const timer = setTimeout(async () => {
      const found = await searchSuggestions(text).catch(() => ({ products: [], vendors: [] }));
      if (cancelled) return;
      setSuggestions([
        ...found.products.map((p) => ({ ...p, type: "product" as const })),
        ...found.vendors.map((v) => ({ ...v, type: "vendor" as const })),
        ...categoryMatches,
      ]);
      setShowDropdown(true);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [queryText, categories]);

  /* ---------------- DASHBOARD LINK ---------------- */
  const dashboardLink =
    profile?.role === "ADMIN"
      ? "/admin"
      : profile?.role === "BUYER"
        ? "/buyer/dashboard"
        : profile?.role === "VENDOR"
          ? "/vendor/dashboard"
          : "/";

  /* ---------------- SEARCH ACTION ---------------- */
  function handleSearch() {
    if (!queryText.trim() && !selectedCategory) return;

    const params = new URLSearchParams();
    params.set("type", "Product");

    if (queryText.trim()) params.set("q", queryText.trim());
    if (selectedCategory) params.set("category", selectedCategory);

    router.push(`/browse?${params.toString()}`);
    setShowDropdown(false);
  }

  return (
    <>
      <nav className={`nav ${scrolled ? "nav-scrolled" : ""} ${!show && "-translate-y-full"} transition-all duration-300`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <Image
              src="/log.webp"
              alt="Sustainly Green"
              width={150}
              height={40}
              priority
              className="h-auto w-[100px] md:w-[150px]"
            />
          </Link>

          <div className="nav-search relative hidden xl:flex">
            <select
              className="hs-cat bg-transparent border-none outline-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search vendors, products, certifications…"
            />
            <button className="nav-search-btn" onClick={handleSearch}>
              <svg viewBox="0 0 18 18" fill="none">
                <circle
                  cx="7.5"
                  cy="7.5"
                  r="5.5"
                  stroke="white"
                  strokeWidth={1.8}
                />
                <path
                  d="M11.5 11.5L16 16"
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 z-50">
                {suggestions.map((s) => (
                  <button
                    key={`${s.type}-${s.id}`}
                    onMouseDown={() => {
                      setShowDropdown(false);
                      if (s.type === "product")
                        router.push(productHref(s.id, s.title));
                      if (s.type === "vendor") router.push(vendorHref(s.id, s.slug));
                      if (s.type === "category")
                        router.push(`/browse?category=${s.id}`);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-800"
                  >
                    {s.type === "product" && <Package className="h-4 w-4" />}
                    {s.type === "vendor" && <Building2 className="h-4 w-4" />}
                    {s.type === "category" && <Layers className="h-4 w-4" />}
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="nav-links">
            <Link href="/browse?type=vendor" className="nav-link active">
              Find Vendors
            </Link>
            <Link href="/categories" className="nav-link">
              Categories
            </Link>
            <Link href="/esg" className="nav-link">
              ESG
            </Link>
          </div>

          <div className="nav-actions">
            {loadingUser ? (
              <span className="nbtn nbtn-ghost hidden md:flex">Checking...</span>
            ) : !authUser ? (
              <>
                <Link href="/login" className="nbtn nbtn-ghost">
                  Login
                </Link>
                <Link
                  href="/register?role=VENDOR"
                  className="nbtn nbtn-outline"
                >
                  List Business
                </Link>
                <Link href="/register?role=BUYER" className="nbtn nbtn-green">
                  Start Sourcing
                </Link>
              </>
            ) : (
              <>
                <span className="nbtn nbtn-ghost hidden md:flex">
                  Hi, {profile?.name || "User"}
                </span>
                <button
                  onClick={() => router.push(dashboardLink)}
                  className="nbtn nbtn-outline"
                >
                  Dashboard
                </button>
                <button
                  onClick={async () => {
                    await signOutSupabase();
                    setAuthUser(null);
                    setProfile(null);
                    router.push("/");
                  }}
                  className="nbtn nbtn-ghost text-red-600 border-none  hidden md:flex"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto lg:hidden">
            <button
              onClick={() => setOpenMobile((p) => !p)}
              className="p-2 rounded-full bg-gray-100"
            >
              {openMobile ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {openMobile && (
          <div className="lg:hidden bg-white border-t">
            <div className="px-6 py-5 space-y-4 text-sm flex flex-col">
              {!loadingUser && !authUser && (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setOpenMobile(false)}
                    className="py-2.5 rounded-xl border text-center font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register?role=VENDOR"
                    onClick={() => setOpenMobile(false)}
                    className="py-2.5 rounded-xl border border-[var(--g)] text-[var(--g2)] text-center font-medium"
                  >
                    List Business
                  </Link>
                  <Link
                    href="/register?role=BUYER"
                    onClick={() => setOpenMobile(false)}
                    className="py-2.5 rounded-xl bg-[var(--g)] text-white text-center font-medium"
                  >
                    Start Sourcing
                  </Link>
                </div>
              )}

              <Link href="esg" onClick={() => setOpenMobile(false)} className="font-medium text-gray-700">
                ESG
              </Link>

              {!loadingUser && authUser && (
                <>
                  <p className="font-semibold text-gray-800">
                    Hi, {profile?.name || "User"}
                  </p>
                  <button
                    className="text-left font-medium text-gray-700"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push(dashboardLink);
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={async () => {
                      await signOutSupabase();
                      setAuthUser(null);
                      setProfile(null);
                      setOpenMobile(false);
                      router.push("/");
                    }}
                    className="text-red-600 font-medium text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
